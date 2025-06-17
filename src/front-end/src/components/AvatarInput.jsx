import React, { useRef, useState, useEffect } from "react";

export default function AvatarInput({ defaultUrl, onChange }) {
  const [preview, setPreview] = useState(defaultUrl);
  const fileRef = useRef();

  useEffect(() => {
    setPreview(defaultUrl);
  }, [defaultUrl]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange && onChange(url);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <img
        src={preview || "/placeholder-avatar.png"}
        alt="Avatar"
        className="w-20 h-20 rounded-full object-cover border"
      />
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
        >
          Trocar foto
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileRef}
          onChange={handleFile}
        />
      </div>
    </div>
  );
} 