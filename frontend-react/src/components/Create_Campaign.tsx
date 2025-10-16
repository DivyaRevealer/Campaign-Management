import React, { useEffect, useState } from "react";
import {
  message,
  Form,
  Card,
  DatePicker,
  Row,
  Col,
  InputNumber,
  Select,
  Button,
  Typography,
  Input,
  Checkbox,
  Radio,
  Upload,
  Space,
  Divider,
  Switch,
  Modal,
} from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import api from "../api";

const { Title, Text, Link } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ---------------- Types ----------------
interface CampaignOptions {
  r_scores: string[];
  f_scores: string[];
  m_scores: string[];
  rfm_segments: string[];
  branches: string[];
  branch_city_map: Record<string, string[]>;
  branch_state_map: Record<string, string[]>;
  brands: string[];
  sections: string[];
  products: string[];
  models: string[];
  items: string[];
  brand_hierarchy: Record<string, string>[];
}

interface CampaignData {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  based_on: string;
  [key: string]: any;
}

interface MultiSelectDropdownProps {
  name: string;
  label: string;
  placeholder?: string;
  optionsProvider: () => string[];
  disabled?: boolean;
}

// ---------------- Component ----------------
const CreateCampaign: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId");
  const isEditing = !!campaignId;

  // ---------- options ----------
  const [options, setOptions] = useState<CampaignOptions>({
    r_scores: [],
    f_scores: [],
    m_scores: [],
    rfm_segments: [],
    branches: [],
    branch_city_map: {},
    branch_state_map: {},
    brands: [],
    sections: [],
    products: [],
    models: [],
    items: [],
    brand_hierarchy: [],
  });

  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // ---------- watch ----------
  const watchBasedOn: string = Form.useWatch("basedOn", form) || "Customer Base";
  const watchName: string = Form.useWatch("name", form) || "";

  const {
    branches,
    branch_city_map,
    branch_state_map,
    r_scores,
    f_scores,
    m_scores,
    rfm_segments,
    brand_hierarchy,
  } = options;

  // ---------- helper functions ----------
  const parseArr = (v: any): any[] =>
    typeof v === "string" ? (v ? JSON.parse(v) : []) : Array.isArray(v) ? v : [];

  const stripQuotes = (v: any): string =>
    typeof v === "string" ? v.replace(/^['"]+|['"]+$/g, "") : v;

  const toRange = (s: string, e: string): [Dayjs, Dayjs] | null => {
    const clean = (v: string) => (typeof v === "string" ? v.replace(/^['"]+|['"]+$/g, "") : v);
    const ds = s ? dayjs(clean(s)) : null;
    const de = e ? dayjs(clean(e)) : null;
    return ds && ds.isValid() && de && de.isValid() ? [ds, de] : null;
  };

  // ---------- load options ----------
  useEffect(() => {
    axios
      .get("/api/campaign/options")
      .then((res) => {
        setOptions(res.data);
        setOptionsLoaded(true);
      })
      .catch(() => message.error("Failed to load filters"));
  }, []);

  // ---------- hydrate edit ----------
  useEffect(() => {
    if (!campaignId) return;
    api
      .get(`/campaign/${campaignId}`)
      .then((res) => {
        const data: CampaignData = res.data;
        form.setFieldsValue({
          name: data.name,
          campaignPeriod: toRange(data.start_date, data.end_date),
          basedOn: data.based_on,
        });
      })
      .catch(() => message.error("Failed to load campaign"));
  }, [campaignId, form]);

  // ---------- save ----------
  const onFinish = async (values: any) => {
    const [startMoment, endMoment] = values.campaignPeriod || [];
    const payload: Record<string, any> = {
      name: values.name,
      start_date: startMoment?.format("YYYY-MM-DD"),
      end_date: endMoment?.format("YYYY-MM-DD"),
      based_on: values.basedOn,
    };

    try {
      let resp;
      if (campaignId) {
        resp = await api.put(`/campaign/${campaignId}`, payload);
        message.success("Campaign updated successfully");
      } else {
        resp = await api.post("/campaign/createCampaign", payload);
        message.success("Campaign saved successfully");
        form.resetFields();
      }

      const newId = campaignId || resp?.data?.id;
      if (values.basedOn === "upload" && uploadFile && newId) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        await api.post(`/campaign/${newId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Contacts uploaded");
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      message.error("Failed to save campaign");
    }
  };

  const handleCheckAndCreate = async () => {
    try {
      const values = form.getFieldsValue();
      const res = await axios.post("/api/campaign/run/count", values);
      const { total_customers, shortlisted_customers } = res.data;
      Modal.confirm({
        title: "Confirm Campaign Creation",
        content: (
          <div>
            <p>
              <strong>Total Customers:</strong> {total_customers}
            </p>
            <p>
              <strong>Shortlisted Customers:</strong> {shortlisted_customers}
            </p>
            <p>Do you want to proceed with creating the campaign?</p>
          </div>
        ),
        okText: "Yes, Create",
        cancelText: "No, Edit",
        onOk: () => form.submit(),
      });
    } catch {
      message.error("Failed to fetch customer counts");
    }
  };

  // ---------- MultiSelect Dropdown ----------
  const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    name,
    label,
    optionsProvider,
    placeholder,
    disabled,
  }) => {
    const allowed = optionsProvider();
    const selected: string[] = Form.useWatch(name, form) || [];
    const ALL = "__ALL__";

    const handleChange = (vals: string[]) => {
      if (vals.includes(ALL) && !selected.includes(ALL)) {
        form.setFieldsValue({ [name]: allowed });
        return;
      }
      form.setFieldsValue({ [name]: vals.filter((v) => v !== ALL) });
    };

    const isAllSelected = allowed.length > 0 && selected.length === allowed.length;

    return (
      <Form.Item name={name} label={label} style={{ marginBottom: 8 }}>
        <Select
          disabled={disabled}
          mode="multiple"
          allowClear
          showSearch
          placeholder={placeholder}
          value={selected}
          onChange={handleChange}
          maxTagCount="responsive"
          optionLabelProp="label"
          options={[
            { label: isAllSelected ? "All (selected)" : "All", value: ALL },
            ...allowed.map((v) => ({ label: v, value: v })),
          ]}
        />
      </Form.Item>
    );
  };

  // ---------- Render ----------
  return (
    <div style={{ fontWeight: "bold", padding: 5, background: "#f0f2f5", minHeight: "50vh" }}>
      <Title level={2}>{isEditing ? "Update Campaign" : "Create Campaign"}</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 1360, margin: "0 auto" }}
      >
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please enter campaign name" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="campaignPeriod"
              label="Period"
              rules={[{ required: true, message: "Please select campaign dates" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Campaign Based On"
              name="basedOn"
              initialValue="Customer Base"
              style={{ marginBottom: 0 }}
            >
              <Radio.Group>
                <Radio value="Customer Base">Customer Base</Radio>
                <Radio value="upload">Upload</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {watchBasedOn === "upload" && (
          <Card title="Upload Contacts" style={{ marginTop: 10 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Link href="/api/campaign/upload/template">Download Template</Link>
                {isEditing && (
                  <>
                    <Divider type="vertical" />
                    <Text strong style={{ color: "#555" }}>
                      Download uploaded file:
                    </Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={`/api/campaign/${campaignId}/upload/download`}
                      download={`${watchName}.xlsx`}
                      style={{ color: "#1890ff" }}
                    >
                      {watchName}.xlsx
                    </Button>
                  </>
                )}
              </div>
              <Upload
                beforeUpload={(file) => {
                  setUploadFile(file);
                  return false;
                }}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  Select File
                </Button>
              </Upload>
            </Space>
          </Card>
        )}

        <Form.Item style={{ textAlign: "center", marginTop: 10 }}>
          <Space>
            <Button type="primary" size="large" onClick={handleCheckAndCreate}>
              {isEditing ? "Update Campaign" : "Check and Create Campaign"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateCampaign;
