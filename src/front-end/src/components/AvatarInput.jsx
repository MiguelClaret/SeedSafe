import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useWalletInfo } from "../contexts/WalletInfoContext";

export default function AvatarInput({ defaultUrl, onChange }) {
  const [preview, setPreview] = useState(defaultUrl);
  const fileRef = useRef();
  const walletInfo = useWalletInfo();
  const wallet = walletInfo?.address || "anonymous";

  useEffect(() => {
    setPreview(defaultUrl);
  }, [defaultUrl]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Remove avatar anterior se existir e pertencer ao bucket 'avatars'
    if (defaultUrl && defaultUrl.includes('/avatars/')) {
      const path = defaultUrl.split('/avatars/')[1];
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }

    // 1. faz upload para Supabase
    const filePath = `${wallet}/${Date.now()}_${file.name}`;
    const { error } = await supabase
       .storage.from('avatars')
       .upload(filePath, file, { upsert: true });
    if (error) { console.error(error); return; }

    const { data } = supabase
       .storage.from('avatars')
       .getPublicUrl(filePath);

    // 2. usa a URL pública
    onChange && onChange(data.publicUrl);
    setPreview(data.publicUrl);
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