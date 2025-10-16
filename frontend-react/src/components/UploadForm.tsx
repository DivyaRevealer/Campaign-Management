import React, { useState, ChangeEvent } from "react";
import axios, { AxiosResponse } from "axios";

// Define the expected backend response structure
interface UploadResponse {
  message: string;
  rows: number;
}

const UploadForm: React.FC = () => {
  const [message, setMessage] = useState<string>("");

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res: AxiosResponse<UploadResponse> = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(`${res.data.message} Rows: ${res.data.rows}`);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("Upload failed. Please try again.");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <input type="file" accept=".csv" onChange={handleUpload} />
      <p>{message}</p>
    </div>
  );
};

export default UploadForm;
