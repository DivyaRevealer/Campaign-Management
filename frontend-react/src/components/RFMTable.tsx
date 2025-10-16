import React, { useEffect, useState } from "react";
import axios from "axios";

// Each RFM record may contain mixed values
interface RFMRecord {
  [key: string]: string | number | null;
}
// Expected API response for sendCampaign
interface CampaignResponse {
  status?: string;
}

const RFMTable: React.FC = () => {
  const [data, setData] = useState<RFMRecord[]>([]);
  const [segment, setSegment] = useState<string>("All");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Load RFM Data
  const loadRFM = async (): Promise<void> => {
    try {
      const res = await axios.get<RFMRecord[]>("/api/rfm");
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        console.error("Invalid data format returned from /api/rfm");
        setData([]);
      }
    } catch (err) {
      console.error("Failed to load RFM data:", err);
      setData([]);
    }
  };

  useEffect(() => {
    loadRFM();
  }, []);

  const filtered: RFMRecord[] =
    segment === "All" ? data : data.filter((d) => d.Segment === segment);

  // Trigger Campaign
  const sendCampaign = async (seg: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaign/${seg}`, {
        method: "POST",
      });
      const result: CampaignResponse = await res.json();
      setStatus(result.status ?? "Campaign triggered successfully!");
    } catch (err) {
      console.error("Campaign trigger failed:", err);
      setStatus("Failed to trigger campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <label htmlFor="segment">Filter Segment: </label>
      <select
        id="segment"
        onChange={(e) => setSegment(e.target.value)}
        value={segment}
        style={{ marginRight: "10px" }}
      >
        <option>All</option>
        <option>Champions</option>
        <option>Loyal</option>
        <option>Potential</option>
        <option>At Risk</option>
        <option>Lost</option>
      </select>

      <button onClick={() => window.open("/api/export", "_blank")}>
        Export to Excel
      </button>

      {["Champions", "Loyal", "Potential", "At Risk", "Lost"].map((seg) => (
        <button
          key={seg}
          onClick={() => sendCampaign(seg)}
          disabled={loading}
          style={{ marginLeft: "10px" }}
        >
          {loading ? "Sending..." : `Trigger ${seg} Campaign`}
        </button>
      ))}

      {status && <p style={{ color: "green", marginTop: "10px" }}>{status}</p>}

      {filtered.length > 0 && (
        <table
          border={1}
          cellPadding={8}
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              {Object.keys(filtered[0] ?? {}).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j}>{String(val ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RFMTable;
