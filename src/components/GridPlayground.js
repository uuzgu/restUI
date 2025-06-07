import React from 'react';

const GridPlayground = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Grid Layout Playground</h2>
      
      {/* Basic Grid Example */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Basic Grid (3 columns)</h3>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-red-100 p-4 rounded-lg h-32 flex items-center justify-center">
              Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Grid Example */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Responsive Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-blue-100 p-4 rounded-lg h-32 flex items-center justify-center">
              Responsive Item {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Grid with Different Sizes */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Grid with Different Sizes</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2 bg-green-100 p-4 rounded-lg h-32 flex items-center justify-center">
            Double Width
          </div>
          <div className="bg-green-100 p-4 rounded-lg h-32 flex items-center justify-center">
            Normal
          </div>
          <div className="bg-green-100 p-4 rounded-lg h-32 flex items-center justify-center">
            Normal
          </div>
        </div>
      </div>

      {/* Nested Grid */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Nested Grid</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-purple-200 p-2 rounded h-20 flex items-center justify-center">
                  Nested {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-purple-200 p-2 rounded h-20 flex items-center justify-center">
                  Nested {i + 5}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid with Auto-fit */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Auto-fit Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-yellow-100 p-4 rounded-lg h-32 flex items-center justify-center">
              Auto-fit Item {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridPlayground; 