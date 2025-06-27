import React from 'react';

const GridPlayground = () => {
  return (
    <div className="max-w-responsive mx-auto px-responsive py-responsive">
      <h2 className="text-responsive-2xl font-bold mb-responsive">Grid Layout Playground</h2>
      
      {/* Basic Grid Example */}
      <div className="mb-responsive-large">
        <h3 className="text-responsive-xl font-semibold mb-responsive">Basic Grid (3 columns)</h3>
        <div className="grid grid-cols-3 gap-responsive">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-red-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
              Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Grid Example */}
      <div className="mb-responsive-large">
        <h3 className="text-responsive-xl font-semibold mb-responsive">Responsive Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-responsive">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-blue-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
              Responsive Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Grid with Different Sizes */}
      <div className="mb-responsive-large">
        <h3 className="text-responsive-xl font-semibold mb-responsive">Grid with Different Sizes</h3>
        <div className="grid grid-cols-4 gap-responsive">
          <div className="col-span-2 bg-green-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
            Double Width
          </div>
          <div className="bg-green-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
            Normal
          </div>
          <div className="bg-green-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
            Normal
          </div>
        </div>
      </div>

      {/* Nested Grid */}
      <div className="mb-responsive-large">
        <h3 className="text-responsive-xl font-semibold mb-responsive">Nested Grid</h3>
        <div className="grid grid-cols-2 gap-responsive">
          <div className="bg-purple-100 p-responsive rounded-lg">
            <div className="grid grid-cols-2 gap-responsive-small">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-purple-200 p-responsive-small rounded h-responsive-grid-item-small flex items-center justify-center">
                  Nested {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-100 p-responsive rounded-lg">
            <div className="grid grid-cols-2 gap-responsive-small">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-purple-200 p-responsive-small rounded h-responsive-grid-item-small flex items-center justify-center">
                  Nested {i + 5}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid with Auto-fit */}
      <div className="mb-responsive-large">
        <h3 className="text-responsive-xl font-semibold mb-responsive">Auto-fit Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-responsive">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-yellow-100 p-responsive rounded-lg h-responsive-grid-item flex items-center justify-center">
              Auto-fit Item {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridPlayground; 