import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Card,
  Typography,
  Select,
  Space,
  Button,
  Checkbox,
  Row,
  Col,
  message,
} from "antd";

const { Option } = Select;
const { Title, Text } = Typography;

// ---------- Interfaces ----------
interface Campaign {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
  based_on?: string;
  shortlisted_count?: number;
  branch?: string[] | string;
  city?: string[] | string;
  state?: string[] | string;
  recency_op?: string;
  recency_min?: number;
  frequency_op?: string;
  frequency_min?: number;
  monetary_op?: string;
  monetary_min?: number;
  r_score?: string[] | string;
  f_score?: string[] | string;
  m_score?: string[] | string;
  purchase_type?: string;
  purchase_brand?: string[];
  section?: string[];
  product?: string[];
  model?: string[];
  item?: string[];
  value_threshold?: number;
  birthday_start?: string;
  birthday_end?: string;
  [key: string]: any;
}

interface Template {
  id: number;
  name: string;
  templateType?: string;
  templateCreateStatus?: string;
}

type BroadcastStatus = "idle" | "ready" | "sending" | "done" | "error";

// ---------- Component ----------
const RunCampaign: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<number | undefined>(undefined);
  const [campaignDetails, setCampaignDetails] = useState<Campaign | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [showNext, setShowNext] = useState<boolean>(false);
  const [status, setStatus] = useState<BroadcastStatus>("idle");
  const [progress, setProgress] = useState<number>(0);

  // ---------- Load Campaigns & Templates ----------
  useEffect(() => {
    loadTemplates();
    api
      .get("/campaign")
      .then((res) => setCampaigns(res.data))
      .catch(() => message.error("Failed to load campaigns"));
  }, []);

  const loadTemplates = () => {
    const token = localStorage.getItem("token");
    api
      .get("/campaign/templates/getAlltemplates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list: Template[] = (res.data.templates || res.data || []).map((t: any) => ({
          id: Number(t.id) || 0,
          name: t.name,
          templateType: t.template_type || t.templateType || t.category,
          templateCreateStatus: t.Status,
        }));
        const approved = list.filter((t) => t.templateCreateStatus === "APPROVED");
        approved.sort((a, b) => b.id - a.id);
        setTemplates(approved);
      })
      .catch(() => message.error("Failed to fetch templates"));
  };

  // ---------- Campaign Selection ----------
  const handleSelectCampaign = (id: number) => {
    setSelectedCampaign(id);
    fetch(`/api/campaign/run/${id}`)
      .then((res) => res.json())
      .then((data: Campaign) => {
        setCampaignDetails(data);
        setShowNext(true);
      })
      .catch(() => message.error("Failed to load campaign details"));
  };

  // ---------- Broadcast ----------
  const startBroadcast = async (): Promise<void> => {
    if (!campaignDetails || !selectedTemplate) {
      message.warning("Please select a campaign and template first.");
      return;
    }
    setStatus("sending");
    setProgress(0);

    try {
      const based_on = campaignDetails.based_on;
      const campaign_id = campaignDetails.id;
      let numbers = "";

      if (based_on === "upload") {
        const res = await fetch(`/api/campaign/${campaign_id}/upload/numbers`);
        const data = await res.json();
        numbers = data.phone_numbers || "";
      }

      const templateRes = await fetch(`/api/campaign/templates/${selectedTemplate}/details`);
      const templateData = await templateRes.json();
      const { template_type, media_type } = templateData;

      let endpoint = "/api/campaign/templates/sendWatsAppText";
      if (template_type === "media") {
        if (media_type === "image") endpoint = "/api/campaign/templates/sendWatsAppImage";
        else if (media_type === "video") endpoint = "/api/campaign/templates/sendWatsAppVideo";
      }

      const payload = {
        phone_numbers: numbers,
        template_name: selectedTemplate,
        basedon_value: based_on,
        campaign_id,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (resJson.success) message.success("Broadcast successful!");
      else message.error("Broadcast failed!");

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setStatus("done");
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    } catch (err) {
      console.error("Broadcast error:", err);
      setStatus("error");
    }
  };

  // ---------- Utility ----------
  const hasValue = (v: unknown): boolean => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim() !== "";
    return v !== 0;
  };

  // ---------- Render ----------
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Card title="Run Campaign" style={{ marginTop: 8 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Choose Campaign:</Text>
            <div style={{ marginTop: 8, paddingLeft: "26px" }}>
              <Select<number>
                placeholder="Select a campaign"
                style={{ width: "39%" }}
                onChange={handleSelectCampaign}
                value={selectedCampaign}
                allowClear
              >
                {campaigns.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Campaign Summary Cards */}
          {campaignDetails && (
            <Row gutter={[16, 16]}>
              {/* Campaign Info */}
              {(hasValue(campaignDetails.name) ||
                hasValue(campaignDetails.start_date) ||
                hasValue(campaignDetails.based_on)) && (
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
                      color: "#fff",
                      height: "200px",
                    }}
                  >
                    <Title level={5} style={{ color: "#fff" }}>
                      Campaign Info
                    </Title>
                    <p>
                      <strong>Name:</strong> {campaignDetails.name}
                    </p>
                    {hasValue(campaignDetails.start_date) && (
                      <p>
                        <strong>Period:</strong> {campaignDetails.start_date} →{" "}
                        {campaignDetails.end_date}
                      </p>
                    )}
                    {hasValue(campaignDetails.based_on) && (
                      <p>
                        <strong>Based On:</strong> {campaignDetails.based_on}
                      </p>
                    )}
                  </Card>
                </Col>
              )}

              {/* Shortlisted Count */}
              {hasValue(campaignDetails.shortlisted_count) && (
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
                      color: "#fff",
                      height: "200px",
                    }}
                  >
                    <Title level={5} style={{ color: "#fff" }}>
                      Customers Shortlisted
                    </Title>
                    <p style={{ fontSize: 22, fontWeight: "bold" }}>
                      {Number(campaignDetails.shortlisted_count).toLocaleString("en-IN")}
                    </p>
                  </Card>
                </Col>
              )}

              {/* Template Selector */}
              {showNext && (
                <Col xs={24} md={8}>
                  <Card
                    style={{
                      background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
                      color: "#fff",
                      height: "200px",
                    }}
                  >
                    <Title level={5}>Template Name</Title>
                    <Select<string>
                      showSearch
                      placeholder="Select an approved template"
                      style={{ width: "100%", marginBottom: 8 }}
                      value={selectedTemplate}
                      onChange={(value) => setSelectedTemplate(value)}
                      allowClear
                      filterOption={(input, option) =>
                        (option?.children?.toString() || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {templates.map((t) => (
                        <Option key={t.name} value={t.name}>
                          {t.name}
                        </Option>
                      ))}
                    </Select>

                    <Title level={5}>Choose Broadcasting Mode</Title>
                    <Checkbox.Group
                      value={channels}
                      onChange={(vals) => setChannels(vals as string[])}
                    >
                      <Space direction="horizontal">
                        <Checkbox value="WhatsApp">WhatsApp</Checkbox>
                        <Checkbox value="SMS">SMS</Checkbox>
                        <Checkbox value="Email">Email</Checkbox>
                      </Space>
                    </Checkbox.Group>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        type="primary"
                        onClick={startBroadcast}
                        style={{
                          backgroundColor: "#36d1dc",
                          borderColor: "#36d1dc",
                        }}
                      >
                        Start Broadcasting
                      </Button>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default RunCampaign;
