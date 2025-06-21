import React, { useState } from "react";
import axios from "axios";
import { UploadCloud } from "lucide-react";

const UploadCropFile = ({ onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(Array.from(e.target.files)); // converte FileList em array
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("imagens", file)); // backend espera "imagens"

    try {
      const response = await axios.post(
        "https://seedsafe.onrender.com/document/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const links = response.data.links;
      alert("Crop documents uploaded successfully!");
      console.log("Uploaded file URLs:", links);
      setFiles([]);

      if (onUploadComplete) {
        onUploadComplete(links); // envia os links para o componente pai
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <label className="text-sm font-medium text-gray-700 flex items-center mb-2">
        <UploadCloud className="w-4 h-4 mr-2 text-green-600" />
        Upload Crop Documents
      </label>

      <input
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.json,.jpg,.jpeg,.png,.pdf"
        onChange={handleChange}
        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0 file:font-semibold
          file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />

      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        className={`mt-4 w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-semibold transition
          ${
            !files.length || uploading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
      >
        {uploading ? "Uploading..." : "Upload Files"}
      </button>
    </div>
  );
};

export default UploadCropFile;
