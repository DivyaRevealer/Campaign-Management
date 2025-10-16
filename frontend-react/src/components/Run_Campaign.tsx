import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

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
  rfm_segment_label?: string;
  brand_label?: string;
  [key: string]: any;
}

interface Template {
  id: number;
  name: string;
  templateType?: string;
  templateCreateStatus?: string;
}

type BroadcastStatus = "idle" | "ready" | "sending" | "done" | "error";

const statusMeta: Record<BroadcastStatus, { text: string; alertType: "info" | "success" | "warning" | "error" }> = {
  idle: { text: "Idle", alertType: "info" },
  ready: { text: "Ready to Broadcast", alertType: "info" },
  sending: { text: "Broadcast in Progress", alertType: "info" },
  done: { text: "Broadcast Completed", alertType: "success" },
  error: { text: "Broadcast Failed", alertType: "error" },
};

// ---------- Component ----------
const RunCampaign: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [selectedCampaign, setSelectedCampaign] = useState<number>();
  const [campaignDetails, setCampaignDetails] = useState<Campaign | null>(null);
  const [showNext, setShowNext] = useState<boolean>(false);

  const [offerText, setOfferText] = useState<string>("");
  const [channels, setChannels] = useState<string[]>([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState<string>("");
  const [smsNumber, setSmsNumber] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [promoCode, setPromoCode] = useState<string>("");
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

  // ---------- Helpers ----------
  const hasValue = (v: unknown): boolean => {
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "number") return v !== 0;
    return true;
  };

  const resetForm = () => {
    setSelectedCampaign(undefined);
    setShowNext(false);
    setOfferText("");
    setChannels([]);
    setWhatsappNumbers("");
    setSmsNumber("");
    setEmailAddress("");
    setPromoCode("");
    setStatus("idle");
    setProgress(0);
    setSelectedTemplate(undefined);
    setCampaignDetails(null);
  };

  const handleGoBack = () => {
    resetForm();
  };

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

  const generatePromo = () => {
    const d = new Date();
    const yymmdd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    setPromoCode(`CAM${yymmdd}${rand}`);
    setStatus("ready");
  };

  // ---------- Broadcast ----------
  const startBroadcast = async (): Promise<void> => {
    if (!campaignDetails || !selectedTemplate) {
      message.warning("Please select both a campaign and a template before broadcasting.");
      return;
    }

    if (!channels.length) {
      message.warning("Select at least one channel to broadcast the campaign.");
      return;
    }

    if (channels.includes("WhatsApp") && campaignDetails.based_on !== "upload" && !whatsappNumbers.trim()) {
      message.warning("Provide WhatsApp numbers or upload recipients before broadcasting.");
      return;
    }

    setStatus("sending");
    setProgress(0);

    const timers: NodeJS.Timeout[] = [];

    const finishWithStatus = (nextStatus: BroadcastStatus) => {
      timers.forEach(clearInterval);
      setProgress((prev) => (nextStatus === "error" ? prev : 100));
      setStatus(nextStatus);
    };

    try {
      if (channels.includes("WhatsApp")) {
        let numbers = whatsappNumbers.trim();
        if (campaignDetails.based_on === "upload") {
          const res = await fetch(`/api/campaign/${campaignDetails.id}/upload/numbers`);
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
          basedon_value: campaignDetails.based_on,
          campaign_id: campaignDetails.id,
          promo_code: promoCode || undefined,
          offer_text: offerText || undefined,
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const resJson = await response.json();
        if (!resJson.success) {
          message.error("WhatsApp broadcast failed.");
          finishWithStatus("error");
          return;
        }
        message.success("WhatsApp broadcast started successfully!");
      }

      if (channels.includes("SMS")) {
        message.info("SMS broadcasting is not yet available in this release.");
      }

      if (channels.includes("Email")) {
        message.info("Email broadcasting is not yet available in this release.");
      }

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setStatus("done");
            return 100;
          }
          return prev + 8;
        });
      }, 300);
      timers.push(timer);
    } catch (err) {
      console.error("Broadcast error:", err);
      message.error("An unexpected error occurred while broadcasting.");
      finishWithStatus("error");
    }
  };

  // ---------- Render ----------
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <Card title="Run Campaign" style={{ marginTop: 8 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Text strong>Choose Campaign:</Text>
              <div style={{ marginTop: 8, paddingLeft: "26px" }}>
                <Select<number>
                  placeholder="Select a campaign"
                  style={{ width: 320 }}
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
            {showNext && (
              <Button type="link" onClick={handleGoBack} style={{ paddingRight: 0 }}>
                ← Back to campaign list
              </Button>
            )}
          </div>

          {campaignDetails && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={18}>
                <Row gutter={[16, 16]}>
                  {hasValue(campaignDetails.shortlisted_count) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Customers Shortlisted
                        </Title>
                        <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 12 }}>
                          {Number(campaignDetails.shortlisted_count).toLocaleString("en-IN")}
                        </div>
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.name) ||
                    (hasValue(campaignDetails.start_date) && hasValue(campaignDetails.end_date)) ||
                    hasValue(campaignDetails.based_on)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Campaign Info
                        </Title>
                        {hasValue(campaignDetails.name) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Name:</strong> {campaignDetails.name}
                          </p>
                        )}
                        {hasValue(campaignDetails.start_date) && hasValue(campaignDetails.end_date) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Period:</strong> {campaignDetails.start_date} → {campaignDetails.end_date}
                          </p>
                        )}
                        {hasValue(campaignDetails.based_on) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Based On:</strong> {campaignDetails.based_on}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.branch) || hasValue(campaignDetails.city) || hasValue(campaignDetails.state)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Location Info
                        </Title>
                        {hasValue(campaignDetails.branch) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Branch:</strong> {Array.isArray(campaignDetails.branch) ? campaignDetails.branch.join(", ") : campaignDetails.branch}
                          </p>
                        )}
                        {hasValue(campaignDetails.city) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>City:</strong> {Array.isArray(campaignDetails.city) ? campaignDetails.city.join(", ") : campaignDetails.city}
                          </p>
                        )}
                        {hasValue(campaignDetails.state) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>State:</strong> {Array.isArray(campaignDetails.state) ? campaignDetails.state.join(", ") : campaignDetails.state}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.recency_min) || hasValue(campaignDetails.frequency_min) || hasValue(campaignDetails.monetary_min)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Targeting Criteria
                        </Title>
                        {hasValue(campaignDetails.recency_min) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Recency:</strong> {campaignDetails.recency_op} {campaignDetails.recency_min}
                          </p>
                        )}
                        {hasValue(campaignDetails.frequency_min) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Frequency:</strong> {campaignDetails.frequency_op} {campaignDetails.frequency_min}
                          </p>
                        )}
                        {hasValue(campaignDetails.monetary_min) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Monetary:</strong> {campaignDetails.monetary_op} {campaignDetails.monetary_min}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.r_score) || hasValue(campaignDetails.f_score) || hasValue(campaignDetails.m_score)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          RFM Scores
                        </Title>
                        {hasValue(campaignDetails.rfm_segment_label) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Segment:</strong> {campaignDetails.rfm_segment_label}
                          </p>
                        )}
                        {hasValue(campaignDetails.r_score) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>R-Score:</strong> {Array.isArray(campaignDetails.r_score) ? campaignDetails.r_score.join(", ") : campaignDetails.r_score}
                          </p>
                        )}
                        {hasValue(campaignDetails.f_score) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>F-Score:</strong> {Array.isArray(campaignDetails.f_score) ? campaignDetails.f_score.join(", ") : campaignDetails.f_score}
                          </p>
                        )}
                        {hasValue(campaignDetails.m_score) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>M-Score:</strong> {Array.isArray(campaignDetails.m_score) ? campaignDetails.m_score.join(", ") : campaignDetails.m_score}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.purchase_type) || hasValue(campaignDetails.purchase_brand) || hasValue(campaignDetails.section)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Purchase & Category
                        </Title>
                        {hasValue(campaignDetails.purchase_type) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Purchase Type:</strong> {campaignDetails.purchase_type}
                          </p>
                        )}
                        {hasValue(campaignDetails.purchase_brand) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Brand:</strong> {campaignDetails.purchase_brand?.join(", ")}
                          </p>
                        )}
                        {hasValue(campaignDetails.section) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Section:</strong> {campaignDetails.section?.join(", ")}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.product) || hasValue(campaignDetails.model) || hasValue(campaignDetails.item)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Product & Model
                        </Title>
                        {hasValue(campaignDetails.product) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Product:</strong> {campaignDetails.product?.join(", ")}
                          </p>
                        )}
                        {hasValue(campaignDetails.model) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Model:</strong> {campaignDetails.model?.join(", ")}
                          </p>
                        )}
                        {hasValue(campaignDetails.item) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Item:</strong> {campaignDetails.item?.join(", ")}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}

                  {(hasValue(campaignDetails.value_threshold) || hasValue(campaignDetails.birthday_start) || hasValue(campaignDetails.birthday_end)) && (
                    <Col xs={24} md={8}>
                      <Card style={{ background: "linear-gradient(135deg, #36d1dc, #5b86e5)", color: "#fff", height: 200 }}>
                        <Title level={5} style={{ color: "#fff", margin: 0 }}>
                          Value & Birthday
                        </Title>
                        {hasValue(campaignDetails.value_threshold) && (
                          <p style={{ marginBottom: 4 }}>
                            <strong>Value Threshold:</strong> {campaignDetails.value_threshold}
                          </p>
                        )}
                        {(hasValue(campaignDetails.birthday_start) || hasValue(campaignDetails.birthday_end)) && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Birthday Range:</strong> {campaignDetails.birthday_start} → {campaignDetails.birthday_end}
                          </p>
                        )}
                      </Card>
                    </Col>
                  )}
                </Row>
              </Col>

              {showNext && (
                <Col xs={24} md={6}>
                  <Card style={{ minHeight: 200 }}>
                    <Title level={5} style={{ marginTop: 0 }}>
                      Template Name
                    </Title>
                    <Select<string>
                      showSearch
                      placeholder="Select an approved template"
                      style={{ width: "100%", marginBottom: 12 }}
                      value={selectedTemplate}
                      onChange={(value) => setSelectedTemplate(value)}
                      allowClear
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children?.toString() || "").toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {templates.map((t) => (
                        <Option key={t.name} value={t.name}>
                          {t.name}
                        </Option>
                      ))}
                    </Select>

                    <Title level={5} style={{ marginTop: 16 }}>
                      Choose Broadcasting Mode
                    </Title>
                    <Checkbox.Group
                      value={channels}
                      onChange={(vals) => setChannels(vals as string[])}
                      style={{ width: "100%" }}
                    >
                      <Space direction="vertical" size={8}>
                        <Checkbox value="WhatsApp">WhatsApp</Checkbox>
                        <Checkbox value="SMS">SMS</Checkbox>
                        <Checkbox value="Email">Email</Checkbox>
                      </Space>
                    </Checkbox.Group>

                    {channels.length > 0 && (
                      <Space wrap style={{ marginTop: 16 }}>
                        {channels.map((channel) => (
                          <Tag color="geekblue" key={channel}>
                            {channel}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {showNext && (
            <Card>
              

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {channels.includes("WhatsApp") && (
                  <Col xs={24} md={12}>
                    <Title level={5}>WhatsApp Numbers</Title>
                    {campaignDetails?.based_on === "upload" ? (
                      <Alert
                        type="info"
                        showIcon
                        message="This campaign is based on uploaded recipients. Numbers will be fetched automatically."
                      />
                    ) : (
                      <TextArea
                        value={whatsappNumbers}
                        onChange={(e) => setWhatsappNumbers(e.target.value)}
                        placeholder="Enter comma or newline separated WhatsApp numbers"
                        autoSize={{ minRows: 3, maxRows: 6 }}
                      />
                    )}
                  </Col>
                )}

                {channels.includes("SMS") && (
                  <Col xs={24} md={12}>
                    <Title level={5}>SMS Contact</Title>
                    <Input
                      value={smsNumber}
                      onChange={(e) => setSmsNumber(e.target.value)}
                      placeholder="Enter the primary SMS contact number"
                    />
                  </Col>
                )}

                {channels.includes("Email") && (
                  <Col xs={24} md={12}>
                    <Title level={5}>Email Address</Title>
                    <Input
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="Enter the email address for campaign communication"
                    />
                  </Col>
                )}
              </Row>

              <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 24 }}>
                <Button
                  type="primary"
                  onClick={startBroadcast}
                  loading={status === "sending"}
                  style={{ alignSelf: "flex-start" }}
                >
                  Start Broadcasting
                </Button>

                {status !== "idle" && (
                  <Alert
                    type={statusMeta[status].alertType}
                    message={statusMeta[status].text}
                    showIcon
                  />
                )}

                {(status === "sending" || status === "done" || status === "error") && (
                  <Progress
                    percent={progress}
                    status={status === "error" ? "exception" : status === "done" ? "success" : "active"}
                  />
                )}
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default RunCampaign;