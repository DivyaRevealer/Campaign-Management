import React, { useEffect, useState, ChangeEvent } from "react";
import api from "../api";
import "../css/template.css";
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Tooltip,
  Drawer,
  Input,
  Row,
  Col,
  Switch,
  message,
  Pagination,
  Select,
  Form,
  Table,
  Modal,
  Radio,
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// ---------- Interfaces ----------
interface TemplateItem {
  id: number;
  key?: string | number;
  name: string;
  templateType?: string;
  templateCreateStatus?: string;
}

interface TemplateFormValues {
  name: string;
  language: string;
  category: string;
  header?: string;
  body: string;
  footer?: string;
}

const TemplateCreation: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<TemplateFormValues>();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [templateType, setTemplateType] = useState<"text" | "media">("text");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [gridView, setGridView] = useState<boolean>(true);
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [headerText, setHeaderText] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");
  const [footerText, setFooterText] = useState<string>("");

  const typeColors: Record<string, string> = { MARKETING: "purple", UTILITY: "blue" };
  const statusColors: Record<string, string> = {
    APPROVED: "green",
    PENDING: "orange",
    REJECTED: "red",
  };
  const gradients = [
    "linear-gradient(135deg, #06beb6, #48b1bf)",
    "linear-gradient(135deg, #4facfe, #00f2fe)",
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #f7971e, #ffd200)",
    "linear-gradient(135deg, #ff0844, #ffb199)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
  ];

  // ---------- Data Load ----------
  const loadTemplates = (): void => {
    const token = localStorage.getItem("token");
    api
      .get("/campaign/templates/getAlltemplates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list: TemplateItem[] = (res.data.templates || res.data || []).map((t: any) => ({
          key: t.id || t.name,
          id: Number(t.id) || 0,
          name: t.name,
          templateType: t.template_type || t.templateType || t.category,
          templateCreateStatus: t.Status,
        }));
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        setTemplates(list);
      })
      .catch(() => message.error("Failed to fetch templates"));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // ---------- UI Helpers ----------
  const filteredTemplates = templates.filter((t) =>
    [t.name, t.templateType, t.templateCreateStatus]
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const start = (currentPage - 1) * pageSize;
  const pagedTemplates = filteredTemplates.slice(start, start + pageSize);

  // ---------- File Handling ----------
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) {
      setMediaFile(null);
      return;
    }
    const limit = mediaType === "image" ? 4 * 1024 * 1024 : 9 * 1024 * 1024;
    if (file.size > limit) {
      message.error(`File must be smaller than ${mediaType === "image" ? "4" : "9"}MB`);
      e.target.value = "";
      setMediaFile(null);
      return;
    }
    setMediaFile(file);
  };

  // ---------- Sync Templates ----------
  const syncTemplate = (templateName: string): void => {
    const token = localStorage.getItem("token");
    api
      .post(
        "/campaign/templates/sync-template",
        { name: templateName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (res.data.sync_status?.success) {
          message.success("Template created successfully");
          loadTemplates();
        }
      })
      .catch(() => message.error("Failed to sync templates"));
  };

  const syncTemplate1 = (templateName: string): void => {
    const token = localStorage.getItem("token");
    api
      .post(
        "/campaign/templates/sync-template",
        { name: templateName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (res.data.sync_status?.success) {
          message.success("Template sync successful!");
          loadTemplates();
        }
      })
      .catch(() => message.error("Failed to sync template"));
  };

  // ---------- Template Submission ----------
  const submit = (): void => {
    form
      .validateFields()
      .then((values) => {
        const token = localStorage.getItem("token");

        if (templateType === "text") {
          const bodyHasVars = /\{\{\d+\}\}/.test(values.body);
          const bodyComponent = bodyHasVars
            ? {
                type: "BODY",
                text: values.body,
                example: { body_text: [[values.body || "sample text"]] },
              }
            : { type: "BODY", text: values.body };

          const payload = {
            name: values.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            language: values.language,
            category: values.category,
            components: [
              { type: "HEADER", format: "TEXT", text: values.header || "" },
              bodyComponent,
              { type: "FOOTER", text: values.footer || "" },
            ],
          };

          api
            .post("/campaign/templates/create-text-template", payload, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
              if (res.data.success) syncTemplate(values.name);
              hideModal();
            })
            .catch(() => message.error("Failed to create template"));
        } else {
          if (!mediaFile) {
            message.error("Please upload a media file");
            return;
          }
          const formData = new FormData();
          formData.append("name", values.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
          formData.append("language", values.language);
          formData.append("category", values.category);
          formData.append("header", values.header || "");
          formData.append("body", values.body);
          formData.append("footer", values.footer || "");
          formData.append("file", mediaFile);

          const endpoint =
            mediaType === "image"
              ? "/campaign/templates/create-image-template"
              : "/campaign/templates/create-video-template";

          api
            .post(endpoint, formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            })
            .then((res) => {
              if (res.data.success) syncTemplate(values.name);
              hideModal();
            })
            .catch(() => message.error("Failed to create media template"));
        }
      })
      .catch(() => {});
  };

  const hideModal = (): void => {
    setOpen(false);
    form.resetFields();
    setTemplateType("text");
    setMediaType("image");
    setMediaFile(null);
  };

  const showModal = (): void => setOpen(true);

  // ---------- Render ----------
  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Space>
          <Title level={3} style={{ margin: 0 }}>
            📑 Templates Manager
          </Title>
          <Switch
            checkedChildren={<AppstoreOutlined />}
            unCheckedChildren={<UnorderedListOutlined />}
            checked={gridView}
            onChange={() => setGridView(!gridView)}
          />
        </Space>
        <Space>
          <Search
            placeholder="Search templates..."
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            Create Template
          </Button>
        </Space>
      </Row>

      {/* Grid View */}
      {gridView ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
          }}
        >
          {pagedTemplates.map((t, i) => (
            <Card
              key={t.id}
              hoverable
              style={{
                height: 120,
                background: gradients[i % gradients.length],
                color: "#fff",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
              }}
              bodyStyle={{ padding: 0, width: "100%" }}
            >
              <div style={{ textAlign: "center" }}>
                <b
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#fff",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {t.name}
                </b>
              </div>
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <Tag color={typeColors[t.templateType || ""] || "default"}>
                  {t.templateType}
                </Tag>
                <Tag color={statusColors[t.templateCreateStatus || ""] || "default"}>
                  {t.templateCreateStatus}
                </Tag>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "12px",
                }}
              >
                <Tooltip title="Sync Template">
                  <SyncOutlined
                    style={{ fontSize: 20, color: "#fff", cursor: "pointer" }}
                    onClick={() => syncTemplate1(t.name)}
                  />
                </Tooltip>
                <Tooltip title="Preview">
                  <EyeOutlined
                    style={{ fontSize: 20, color: "#fff", cursor: "pointer" }}
                    onClick={() => setPreview(t)}
                  />
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Table<TemplateItem>
          columns={[
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "TemplateType", dataIndex: "templateType", key: "templateType" },
            {
              title: "TemplateCreateStatus",
              dataIndex: "templateCreateStatus",
              key: "templateCreateStatus",
            },
            {
              title: "Sync Template",
              key: "action",
              render: (_, record) => (
                <SyncOutlined
                  style={{ color: "#7367F0", fontSize: 18, cursor: "pointer" }}
                  onClick={() => syncTemplate1(record.name)}
                />
              ),
            },
          ]}
          dataSource={filteredTemplates.slice(start, start + pageSize)}
          rowKey="id"
          bordered
          size="middle"
          pagination={false}
        />
      )}

      {/* Pagination */}
      <Row justify="center" style={{ marginTop: 20 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredTemplates.length}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size || 15);
          }}
          showSizeChanger
          pageSizeOptions={["15", "30"]}
        />
      </Row>

      {/* Drawer Preview */}
      <Drawer
        title={`Preview: ${preview?.name}`}
        placement="right"
        onClose={() => setPreview(null)}
        open={!!preview}
        width={400}
      >
        {preview && (
          <div
            style={{
              height: 150,
              background: gradients[0],
              color: "#fff",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <b style={{ fontSize: 16 }}>{preview.name}</b>
            <div style={{ marginTop: 8 }}>
              <Tag color={typeColors[preview.templateType || ""] || "default"}>
                {preview.templateType}
              </Tag>
              <Tag color={statusColors[preview.templateCreateStatus || ""] || "default"}>
                {preview.templateCreateStatus}
              </Tag>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Template Modal */}
      <Modal
        open={open}
        title="Create Template"
        onCancel={hideModal}
        footer={null}
        bodyStyle={{ background: "#f9f9f9", padding: 16 }}
        width={1100}
        maskClosable={false}
        keyboard={false}
        centered={false}
        style={{ top: 20 }}
      >
        <Row gutter={24}>
          <Col span={14}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ language: "en", category: "MARKETING" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Template Name"
                    rules={[{ required: true, message: "Please enter name" }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="language" label="Language" rules={[{ required: true }]}>
                    <Select>
                      <Option value="en">English</Option>
                      <Option value="hi">Hindi</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                    <Select>
                      <Option value="MARKETING">Marketing</Option>
                      <Option value="UTILITY">Utility</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="templateType"
                    label="Template Type"
                    rules={[{ required: true, message: "Please select template type" }]}
                  >
                    <Select
                      value={templateType}
                      onChange={(val) => setTemplateType(val as "text" | "media")}
                    >
                      <Option value="text">Text</Option>
                      <Option value="media">Media</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {templateType === "media" && (
                <Form.Item label="Media Type" required>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <Radio.Group
                      onChange={(e) => setMediaType(e.target.value)}
                      value={mediaType}
                    >
                      <Radio value="image">Image</Radio>
                      <Radio value="video">Video</Radio>
                    </Radio.Group>
                    <div>
                      <input
                        type="file"
                        accept={mediaType === "image" ? "image/*" : "video/*"}
                        onChange={handleFileChange}
                      />
                      <div style={{ fontSize: 12 }}>
                        Upload {mediaType} less than {mediaType === "image" ? "4MB" : "9MB"}
                      </div>
                    </div>
                  </div>
                </Form.Item>
              )}

              <Form.Item name="header" label="Header Text">
                <Input onChange={(e) => setHeaderText(e.target.value)} />
              </Form.Item>
              <Form.Item
                name="body"
                label="Body Text"
                rules={[{ required: true, message: "Please enter body text" }]}
              >
                <Input.TextArea
                  rows={3}
                  onChange={(e) => setBodyText(e.target.value)}
                />
              </Form.Item>
              <Form.Item name="footer" label="Footer Text">
                <Input onChange={(e) => setFooterText(e.target.value)} />
              </Form.Item>
              <div style={{ marginTop: 20, textAlign: "right" }}>
                <Button onClick={hideModal} style={{ marginRight: 8 }}>
                  Cancel
                </Button>
                <Button type="primary" onClick={submit}>
                  Submit
                </Button>
              </div>
            </Form>
          </Col>

          {/* Preview */}
          <Col span={10} style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                border: "2px solid #ccc",
                borderRadius: 24,
                width: 280,
                background: "#f0f0f0",
                boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                padding: 16,
              }}
            >
              <div
                style={{
                  background: "#075E54",
                  color: "#fff",
                  borderRadius: "16px 16px 0 0",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                WhatsApp Preview
              </div>
              <div style={{ padding: "8px", background: "#fff", borderRadius: "0 0 16px 16px" }}>
                {mediaFile && (
                  <div style={{ marginBottom: 8 }}>
                    {mediaType === "image" ? (
                      <img
                        src={URL.createObjectURL(mediaFile)}
                        alt="header preview"
                        style={{ width: "100%", borderRadius: 8 }}
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(mediaFile)}
                        controls
                        style={{ width: "100%", borderRadius: 8 }}
                      />
                    )}
                  </div>
                )}
                {headerText && <div style={{ fontSize: 14, marginBottom: 8 }}>{headerText}</div>}
                {bodyText && (
                  <div
                    style={{
                      background: "#dcf8c6",
                      padding: "10px 14px",
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    {bodyText}
                  </div>
                )}
                {footerText && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    {footerText}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default TemplateCreation;
