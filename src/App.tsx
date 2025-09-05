import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, Palette } from 'lucide-react';

interface ImageState {
  original: string | null;
  transformed: string | null;
}

const App: React.FC = () => {
  const [images, setImages] = useState<ImageState>({ original: null, transformed: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImages({ original: imageUrl, transformed: null });
      processImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (imageUrl: string) => {
    setIsProcessing(true);
    
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Tampilkan gambar originalnya
      ctx.drawImage(img, 0, 0);

      // Dapatkan data pixel
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Nah disini agak beda, kalau di matlab seinget saya bentuknya array multi dimensi, kalau di JS ini array 1 dimensi
      // Setiap pixel terdiri dari 4 nilai: R, G, B, A (Alpha)
      // Jadi pixel pertama ada di index 0,1,2,3; pixel kedua di index 4,5,6,7; dst.
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        // Hitung rata-rata RGB
        const average = (r + g + b) / 3;

        if (average > 128) {
          // Buat jadi pink, kreasikan sesuai selera, bisa pakai nilai average untuk gradasi
          data[i] = 231;     // Red
          data[i + 1] = 84; // Green
          data[i + 2] = 128; // Blue
        } else {
          // yang ini jadi hijau
          data[i] = 1;       // Red
          data[i + 1] = average; // Green
          data[i + 2] = 32;   // Blue
        }
        // Alpha / transparansi gambar tetap sama
        data[i + 3] = alpha;
      }

      // Update canvas dengan data pixel yang sudah diubah
      ctx.putImageData(imageData, 0, 0);

      // Dapatkan URL gambar dari canvas
      const transformedImageUrl = canvas.toDataURL();
      setImages(prev => ({ ...prev, transformed: transformedImageUrl }));
      setIsProcessing(false);
    };

    img.src = imageUrl;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetImages = () => {
    setImages({ original: null, transformed: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">Ubah Photomu jadi Pink dan Hijau</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Upload gambar dan saya akan mengubahnya menjadi kombinasi warna pink dan hijau berdasarkan kecerahan pixelnya.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pixel dengan rata-rata RGB di atas 128 akan menjadi pink, sedangkan yang di bawah atau sama dengan 128 akan menjadi hijau.
          </p>
        </div>

        {/* Upload Section */}
        {!images.original && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer"
            >
              <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Photomu</h3>
              <p className="text-gray-500 mb-4">Tekan disini untuk upload gambar</p>
              <div className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                <ImageIcon className="w-5 h-5 mr-2" />
                Pilih File
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Images Display */}
        {images.original && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Hasilnya </h2>
              <button
                onClick={resetImages}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Upload ulang
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Original Image */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Gambar Asli</h3>
                <div className="border rounded-xl overflow-hidden shadow-md">
                  <img
                    src={images.original}
                    alt="Original"
                    className="w-full h-auto max-h-96 object-contain bg-gray-50"
                  />
                </div>
              </div>

              {/* Transformed Image */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Gambar yang Diubah
                  {isProcessing && (
                    <span className="ml-2 text-sm text-purple-600 animate-pulse">
                      Lagi Proses...
                    </span>
                  )}
                </h3>
                <div className="border rounded-xl overflow-hidden shadow-md">
                  {isProcessing ? (
                    <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                    </div>
                  ) : images.transformed ? (
                    <img
                      src={images.transformed}
                      alt="Transformed"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">Transformation will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            

            
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default App;