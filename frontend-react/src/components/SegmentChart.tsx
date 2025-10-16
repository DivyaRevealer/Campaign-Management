import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// ---------- Types ----------
interface RFMRecord {
  Segment: string;
  [key: string]: any;
}

type SegmentCountMap = Record<string, number>;

// ---------- Component ----------
const SegmentChart: React.FC = () => {
  const [segmentCounts, setSegmentCounts] = useState<SegmentCountMap>({});

  useEffect(() => {
    const loadSegments = async (): Promise<void> => {
      try {
        const res = await axios.get<RFMRecord[]>("/api/rfm");
        const counts: SegmentCountMap = {};
        res.data.forEach((row) => {
          if (row.Segment) {
            counts[row.Segment] = (counts[row.Segment] || 0) + 1;
          }
        });
        setSegmentCounts(counts);
      } catch (err) {
        console.error("Failed to load segment data:", err);
      }
    };

    loadSegments();
  }, []);

  const data = {
    labels: Object.keys(segmentCounts),
    datasets: [
      {
        label: "Customer Segments",
        data: Object.values(segmentCounts),
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCE56",
          "#66BB6A",
          "#AB47BC",
          "#FFA726",
          "#29B6F6",
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ maxWidth: "320px", margin: "auto", height: "320px" }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default SegmentChart;
