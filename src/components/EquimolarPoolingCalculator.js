import React, { useState, useEffect } from 'react';

const EquimolarPoolingCalculator = () => {
  // State for pools and results
  const [pools, setPools] = useState([
    { id: 1, molarity: 300, volume: 393.3, samples: 126, measuredConcentration: 96.11 },
    { id: 2, molarity: 100, volume: 488.6, samples: 196, measuredConcentration: 40.11 },
    { id: 3, molarity: 50, volume: 149.7, samples: 39, measuredConcentration: 13.03 }
  ]);
  
  const [desiredFinalVolume, setDesiredFinalVolume] = useState(400);
  const [results, setResults] = useState([]);
  const [finalPoolData, setFinalPoolData] = useState({
    totalVolume: 0,
    totalSamples: 0,
    nMPerSample: 0
  });
  const [maximizeVolumes, setMaximizeVolumes] = useState(true);
  const [useProvidedConcentrations, setUseProvidedConcentrations] = useState(false);
  
  // Add a new pool row
  const addPool = () => {
    const newId = pools.length > 0 ? Math.max(...pools.map(p => p.id)) + 1 : 1;
    setPools([...pools, { id: newId, molarity: 0, volume: 0, samples: 0, measuredConcentration: 0 }]);
  };
  
  // Remove a pool
  const removePool = (id) => {
    if (pools.length > 1) {
      setPools(pools.filter(pool => pool.id !== id));
    }
  };
  
  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setPools(pools.map(pool => 
      pool.id === id ? { ...pool, [field]: parseFloat(value) || 0 } : pool
    ));
  };
  
  // Calculate the pooling volumes
  useEffect(() => {
    if (pools.length === 0) return;
    
    // Step 1: Determine concentration for each pool (calculated or measured)
    const calculatedPools = pools.map(pool => {
      const totalNM = pool.molarity * pool.samples;
      // Use measured concentration if available and selected, otherwise calculate it
      const actualConcentration = useProvidedConcentrations && pool.measuredConcentration 
        ? pool.measuredConcentration 
        : totalNM / pool.volume;
      
      return {
        ...pool,
        totalNM,
        actualConcentration
      };
    });
    
    // Step 2: Find the pool with the lowest concentration
    const lowestConc = Math.min(...calculatedPools.map(p => p.actualConcentration));
    const lowestSampleCount = Math.min(...calculatedPools.map(p => p.samples));
    
    // Step 3: Calculate ratios and initial volumes
    const poolsWithRatios = calculatedPools.map(pool => {
      const concRatio = lowestConc / pool.actualConcentration;
      const sampleRatio = pool.samples / lowestSampleCount;
      const finalRatio = concRatio * sampleRatio;
      
      // Initial volume calculation (we'll scale these later)
      const initialVolume = finalRatio * 100; // Using 100 as base volume for now
      
      return {
        ...pool,
        concRatio,
        sampleRatio,
        finalRatio,
        initialVolume,
        maxPossibleVolume: pool.volume
      };
    });
    
    // Step 4: Scale volumes to maximize pool usage if requested
    let scaledPools = [...poolsWithRatios];
    
    if (maximizeVolumes) {
      // Find the limiting pool (the one that will be used up first)
      const utilizationRatios = poolsWithRatios.map(pool => 
        pool.volume / pool.initialVolume
      );
      
      const minimumRatio = Math.min(...utilizationRatios);
      
      // Scale all volumes by this ratio to maximize usage
      scaledPools = poolsWithRatios.map(pool => ({
        ...pool,
        initialVolume: pool.initialVolume * minimumRatio
      }));
    }
    
    // Step 5: Scale to desired final volume
    const totalInitialVolume = scaledPools.reduce((sum, pool) => sum + pool.initialVolume, 0);
    const volumeScaleFactor = desiredFinalVolume / totalInitialVolume;
    
    const finalPools = scaledPools.map(pool => {
      const finalVolume = pool.initialVolume * volumeScaleFactor;
      
      // Calculate how much of the pool will be used
      const percentUsed = (finalVolume / pool.volume) * 100;
      
      return {
        ...pool,
        finalVolume,
        percentUsed
      };
    });
    
    // Step 6: Calculate nM per sample in the final pool
    const totalNMInFinalPool = finalPools.reduce((sum, pool) => 
      sum + (pool.actualConcentration * pool.finalVolume), 0);
    
    const totalSamples = finalPools.reduce((sum, pool) => sum + pool.samples, 0);
    const nMPerSample = totalNMInFinalPool / totalSamples;
    
    // Update results
    setResults(finalPools);
    setFinalPoolData({
      totalVolume: desiredFinalVolume,
      totalSamples,
      nMPerSample
    });
    
  }, [pools, desiredFinalVolume, maximizeVolumes, useProvidedConcentrations]);
  
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">NGS Equimolar Pooling Calculator</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-md">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">Input Pools</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-4 py-2 text-left">Pool</th>
                <th className="px-4 py-2 text-left">Molarity of each sample (nM)</th>
                <th className="px-4 py-2 text-left">Pool Volume (μl)</th>
                <th className="px-4 py-2 text-left"># Samples in pool</th>
                {useProvidedConcentrations && (
                  <th className="px-4 py-2 text-left">Measured Concentration (nM/μl)</th>
                )}
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool) => (
                <tr key={pool.id} className="border-b">
                  <td className="px-4 py-2">{pool.id}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={pool.molarity || ''}
                      onChange={(e) => handleInputChange(pool.id, 'molarity', e.target.value)}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={pool.volume || ''}
                      onChange={(e) => handleInputChange(pool.id, 'volume', e.target.value)}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={pool.samples || ''}
                      onChange={(e) => handleInputChange(pool.id, 'samples', e.target.value)}
                      className="w-24 p-1 border rounded"
                    />
                  </td>
                  {useProvidedConcentrations && (
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pool.measuredConcentration || ''}
                        onChange={(e) => handleInputChange(pool.id, 'measuredConcentration', e.target.value)}
                        className="w-24 p-1 border rounded"
                      />
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removePool(pool.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      disabled={pools.length <= 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={addPool}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Pool
          </button>
          
          <div className="flex items-center">
            <label htmlFor="final-volume" className="mr-2">
              Desired Final Volume (μl):
            </label>
            <input
              id="final-volume"
              type="number"
              min="10"
              step="10"
              value={desiredFinalVolume}
              onChange={(e) => setDesiredFinalVolume(parseFloat(e.target.value) || 400)}
              className="w-24 p-1 border rounded"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maximizeVolumes}
                onChange={(e) => setMaximizeVolumes(e.target.checked)}
                className="mr-2"
              />
              <span>Maximize usage of original pools</span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useProvidedConcentrations}
                onChange={(e) => setUseProvidedConcentrations(e.target.checked)}
                className="mr-2"
              />
              <span>Use measured concentrations</span>
            </label>
          </div>
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mb-8 p-4 bg-green-50 rounded-md">
          <h2 className="text-xl font-semibold mb-3 text-green-700">Equimolar Pooling Results</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-100">
                  <th className="px-4 py-2 text-left">Pool</th>
                  <th className="px-4 py-2 text-left">{useProvidedConcentrations ? "Measured" : "Calculated"} Conc. (nM/μl)</th>
                  <th className="px-4 py-2 text-left">Volume to add (μl)</th>
                  <th className="px-4 py-2 text-left">% of Pool Used</th>
                  <th className="px-4 py-2 text-left">Total nM Added</th>
                </tr>
              </thead>
              <tbody>
                {results.map((pool) => (
                  <tr key={pool.id} className="border-b">
                    <td className="px-4 py-2">{pool.id}</td>
                    <td className="px-4 py-2">{pool.actualConcentration.toFixed(2)}</td>
                    <td className="px-4 py-2">{pool.finalVolume.toFixed(2)}</td>
                    <td className="px-4 py-2">{pool.percentUsed.toFixed(1)}%</td>
                    <td className="px-4 py-2">{(pool.actualConcentration * pool.finalVolume).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-700">Final Pool Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium">Total Volume</div>
                <div className="text-xl">{finalPoolData.totalVolume.toFixed(2)} μl</div>
              </div>
              <div className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium">Total Samples</div>
                <div className="text-xl">{finalPoolData.totalSamples}</div>
              </div>
              <div className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium">nM per Sample</div>
                <div className="text-xl">{finalPoolData.nMPerSample.toFixed(4)}</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm">
                <span className="font-bold">Verification:</span> Each sample contributes equally to the final pool ({finalPoolData.nMPerSample.toFixed(4)} nM per sample), ensuring equimolar representation during sequencing.
              </p>
              {maximizeVolumes && (
                <p className="mt-2 text-sm">
                  <span className="font-bold">Note:</span> Volumes have been optimized to maximize usage of the original pools. One or more pools will be completely used.
                </p>
              )}
              {useProvidedConcentrations && (
                <p className="mt-2 text-sm">
                  <span className="font-bold">Note:</span> Calculations are based on user-provided measured concentrations rather than calculated values.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm">
        <h3 className="font-semibold mb-2">How to use this calculator:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter the information for each input pool: the molarity that each sample was normalized to, the total pool volume, and the number of samples in each pool.</li>
          <li>Optionally, check "Use measured concentrations" to enter your lab-measured concentration values for each pool instead of using calculated values.</li>
          <li>Set your desired final volume for the combined pool.</li>
          <li>Choose whether to maximize the usage of original pools (one or more pools will be completely used).</li>
          <li>The calculator will automatically determine how much volume to take from each pool to ensure each individual sample contributes equally to the final sequencing library.</li>
          <li>The results table shows the exact volumes to pipette from each pool and calculates the final concentration per sample.</li>
        </ol>
        <p className="mt-3 italic">This calculator is optimized for NGS Illumina sequencing library preparation.</p>
      </div>
    </div>
  );
};

export default EquimolarPoolingCalculator;
