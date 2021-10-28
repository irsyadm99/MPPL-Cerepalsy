import Button from "./Button";

function Header() {
  return (
    <header className="sticky top-0 flex z-50 justify-evenly bg-white py-5 px-6 shadow-sm ">
      {/* Left */}
      <div className="flex items-center justify-center cursor-pointer">
        <h1 className="text-xl font-bold text-primary">CEREPALSY</h1>
      </div>

      {/* Middle */}
      <div className="flex space-x-8 items-center">
        <h3 className="text-md text-gray-400 cursor-pointer">Tentang CP</h3>
        <h3 className="text-md text-gray-400 cursor-pointer">Gizi CP</h3>
        <h3 className="text-md text-gray-400 cursor-pointer">
          Rekomendasi Menu
        </h3>
        <h3 className="text-md text-gray-400 cursor-pointer">Forum</h3>
      </div>

      {/* Right */}
      <div className="flex space-x-2">
        <button className="px-4 py-2 text-primary bg-white border-2 border-primary-border font-semibold rounded-lg">
          Masuk
        </button>
        <Button text="Daftar" />
      </div>
    </header>
  );
}

export default Header;