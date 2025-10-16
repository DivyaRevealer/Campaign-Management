import React, { useEffect, useState } from "react";
import { Table, Button, message, Typography, Card } from "antd";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import api from "../api";

const { Title } = Typography;

// -------------------- Type Definitions --------------------
interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

// -------------------- Component --------------------
const CampaignSummary: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const navigate = useNavigate();

  // Load campaign data
  useEffect(() => {
    api
      .get("/campaign")
      .then((res) => setCampaigns(res.data))
      .catch(() => message.error("Failed to load campaigns"));
  }, []);

  // Define table columns
  const columns: ColumnsType<Campaign> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: Campaign) => (
        <Button
          type="primary"
          style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
          onClick={() =>
            navigate(`/create-campaign?campaignId=${record.id}`)
          }
        >
          Edit
        </Button>
      ),
    },
  ];

  // -------------------- Render --------------------
  return (
    <Card
      bordered
      style={{
        margin: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: 8,
      }}
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
        Campaign Summary
      </Title>

      <Table<Campaign>
        rowKey="id"
        dataSource={campaigns}
        columns={columns}
        bordered
        pagination={{ pageSize: 10 }}
        size="middle"
        onRow={(_, index) => ({
          style: {
            backgroundColor: index !== undefined && index % 2 === 0 ? "#fafafa" : "#ffffff",
          },
        })}
      />
    </Card>
  );
};

export default CampaignSummary;
