import React, { useCallback, useEffect, useMemo, useState } from "react";
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

type BrandHierarchyEntry = {
  brand: string;
  section: string;
  product: string;
  model: string;
  item: string;
};


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
  brand_hierarchy: BrandHierarchyEntry[];
}

interface CampaignData {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  based_on: string;
  [key: string]: any;
}
type DateRangeValue = [Dayjs, Dayjs] | null;

interface RfmModeFormValue {
  customized?: boolean;
  segmented?: boolean;
}

interface PurchaseTypeFormValue {
  anyPurchase?: boolean;
  recentPurchase?: boolean;
}

interface FormValues {
  name: string;
  campaignPeriod: [Dayjs, Dayjs];
  basedOn: string;
  recencyOp?: string;
  recencyMin?: number;
  recencyMax?: number;
  frequencyOp?: string;
  frequencyMin?: number;
  frequencyMax?: number;
  monetaryOp?: string;
  monetaryMin?: number;
  monetaryMax?: number;
  rScore?: string[];
  fScore?: string[];
  mScore?: string[];
  rfmSegment?: string[];
  rfmMode?: RfmModeFormValue;
  branch?: string[];
  city?: string[];
  state?: string[];
  birthdayRange?: DateRangeValue;
  anniversaryRange?: DateRangeValue;
  purchaseType?: PurchaseTypeFormValue;
  purchaseBrand?: string[];
  section?: string[];
  product?: string[];
  model?: string[];
  item?: string[];
  valueThreshold?: number;
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
  
  const [form] = Form.useForm<FormValues>();
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

   const watchBranch: string[] = Form.useWatch("branch", form) || [];
  const watchCity: string[] = Form.useWatch("city", form) || [];
  const watchState: string[] = Form.useWatch("state", form) || [];
  const watchPurchaseBrand: string[] = Form.useWatch("purchaseBrand", form) || [];
  const watchSection: string[] = Form.useWatch("section", form) || [];
  const watchProduct: string[] = Form.useWatch("product", form) || [];
  const watchModel: string[] = Form.useWatch("model", form) || [];
  const watchItem: string[] = Form.useWatch("item", form) || [];
  const watchValueThreshold: number | null = Form.useWatch("valueThreshold", form);

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
  const parseArr = (v: unknown): string[] =>
    typeof v === "string" ? (v ? JSON.parse(v) : []) : Array.isArray(v) ? (v as string[]) : [];

  const stripQuotes = (v: unknown): string =>
    typeof v === "string" ? v.replace(/^['"]+|['"]+$/g, "") : (v as string);

  const toRange = (s?: string | null, e?: string | null): DateRangeValue => {
    const clean = (value?: string | null) =>
      typeof value === "string" ? value.replace(/^['"]+|['"]+$/g, "") : value;

  // ---------- load options ----------

  const requirePurchaseType = useMemo(
    () =>
      (watchPurchaseBrand && watchPurchaseBrand.length > 0) ||
      (watchSection && watchSection.length > 0) ||
      (watchProduct && watchProduct.length > 0) ||
      (watchModel && watchModel.length > 0) ||
      (watchItem && watchItem.length > 0) ||
      !!watchValueThreshold,
    [
      watchPurchaseBrand,
      watchSection,
      watchProduct,
      watchModel,
      watchItem,
      watchValueThreshold,
    ]
  );

  const computeGeoOptions = useCallback(() => {
    const allowedBranches = branches.filter((branch) => {
      const cities = branch_city_map?.[branch] || [];
      const states = branch_state_map?.[branch] || [];
      const cityOK = watchCity.length ? watchCity.some((city) => cities.includes(city)) : true;
      const stateOK = watchState.length ? watchState.some((state) => states.includes(state)) : true;
      return cityOK && stateOK;
    });

    const sourceBranches = watchBranch.length ? watchBranch : allowedBranches;
    const allCitiesFromAllowedBranches = new Set<string>(
      sourceBranches.flatMap((branch) => branch_city_map?.[branch] || [])
    );
    const allowedCities = Array.from(allCitiesFromAllowedBranches).filter((city) =>
      watchState.length
        ? allowedBranches.some(
            (branch) =>
              (branch_city_map?.[branch] || []).includes(city) &&
              (branch_state_map?.[branch] || []).some((state) => watchState.includes(state))
          )
        : true
    );

    const allStatesFromAllowedBranches = new Set<string>(
      sourceBranches.flatMap((branch) => branch_state_map?.[branch] || [])
    );
    const allowedStates = Array.from(allStatesFromAllowedBranches).filter((state) =>
      watchCity.length
        ? allowedBranches.some(
            (branch) =>
              (branch_state_map?.[branch] || []).includes(state) &&
              (branch_city_map?.[branch] || []).some((city) => watchCity.includes(city))
          )
        : true
    );

    return { allowedBranches, allowedCities, allowedStates };
  }, [
    branches,
    branch_city_map,
    branch_state_map,
    watchBranch,
    watchCity,
    watchState,
  ]);

  const computeBrandOptions = useCallback(() => {
    let filtered = brand_hierarchy || [];

    if (watchPurchaseBrand.length) {
      filtered = filtered.filter((entry) => watchPurchaseBrand.includes(entry.brand));
    }
    if (watchSection.length) {
      filtered = filtered.filter((entry) => watchSection.includes(entry.section));
    }
    if (watchProduct.length) {
      filtered = filtered.filter((entry) => watchProduct.includes(entry.product));
    }
    if (watchModel.length) {
      filtered = filtered.filter((entry) => watchModel.includes(entry.model));
    }
    if (watchItem.length) {
      filtered = filtered.filter((entry) => watchItem.includes(entry.item));
    }

    const allowedBrands = Array.from(new Set(filtered.map((entry) => entry.brand)));
    const allowedSections = Array.from(new Set(filtered.map((entry) => entry.section)));
    const allowedProducts = Array.from(new Set(filtered.map((entry) => entry.product)));
    const allowedModels = Array.from(new Set(filtered.map((entry) => entry.model)));
    const allowedItems = Array.from(new Set(filtered.map((entry) => entry.item)));

    return { allowedBrands, allowedSections, allowedProducts, allowedModels, allowedItems };
  }, [brand_hierarchy, watchItem, watchModel, watchProduct, watchPurchaseBrand, watchSection]);


  useEffect(() => {
    axios
      .get("/api/campaign/options")
      .then((res) => {
        setOptions(res.data);
        setOptionsLoaded(true);
      })
      .catch(() => message.error("Failed to load filters"));
  }, []);

   useEffect(() => {
    if (!campaignId) {
      form.setFieldsValue({
        basedOn: "Customer Base",
        rfmMode: { customized: true, segmented: false },
        purchaseType: { anyPurchase: true, recentPurchase: false },
      });
    }
  }, [campaignId, form]);

  // ---------- hydrate edit ----------
  useEffect(() => {
    if (!campaignId) return;
    api
      .get(`/campaign/${campaignId}`)
      .then((res) => {
        const data: CampaignData = res.data;
        form.setFieldsValue({
          name: data.name,
          campaignPeriod: toRange(data.start_date, data.end_date) ?? undefined,
          basedOn: data.based_on,
          recencyOp: data.recency_op,
          recencyMin: data.recency_min,
          recencyMax: data.recency_max,
          frequencyOp: data.frequency_op,
          frequencyMin: data.frequency_min,
          frequencyMax: data.frequency_max,
          monetaryOp: data.monetary_op,
          monetaryMin: data.monetary_min,
          monetaryMax: data.monetary_max,
          rScore: parseArr(data.r_score),
          fScore: parseArr(data.f_score),
          mScore: parseArr(data.m_score),
          rfmSegment: parseArr(data.rfm_segments),
          branch: parseArr(data.branch),
          city: parseArr(data.city),
          state: parseArr(data.state),
          birthdayRange: toRange(stripQuotes(data.birthday_start), stripQuotes(data.birthday_end)) ?? undefined,
          anniversaryRange:
            toRange(stripQuotes(data.anniversary_start), stripQuotes(data.anniversary_end)) ?? undefined,
          purchaseBrand: parseArr(data.purchase_brand),
          section: parseArr(data.section),
          product: parseArr(data.product),
          model: parseArr(data.model),
          item: parseArr(data.item),
          valueThreshold: data.value_threshold,
          rfmMode: {
            customized: data.rfm_mode === "customized",
            segmented: data.rfm_mode === "segmented",
          },
          purchaseType: {
            anyPurchase: data.purchase_type === "any",
            recentPurchase: data.purchase_type === "recent",
          },
        });
      })
      .catch(() => message.error("Failed to load campaign"));
  }, [campaignId, form]);

  // ---------- save ----------
  useEffect(() => {
    if (!optionsLoaded) return;
    const { allowedBranches, allowedCities, allowedStates } = computeGeoOptions();
    const pruned = {
      branch: watchBranch.filter((branch) => allowedBranches.includes(branch)),
      city: watchCity.filter((city) => allowedCities.includes(city)),
      state: watchState.filter((state) => allowedStates.includes(state)),
    };

    if (
      pruned.branch.length !== watchBranch.length ||
      pruned.city.length !== watchCity.length ||
      pruned.state.length !== watchState.length
    ) {
      form.setFieldsValue(pruned);
    }
  }, [
    computeGeoOptions,
    form,
    optionsLoaded,
    watchBranch,
    watchCity,
    watchState,
  ]);

  useEffect(() => {
    if (!optionsLoaded || !brand_hierarchy?.length) return;
    const { allowedBrands, allowedSections, allowedProducts, allowedModels, allowedItems } =
      computeBrandOptions();
    const pruned = {
      purchaseBrand: watchPurchaseBrand.filter((brand) => allowedBrands.includes(brand)),
      section: watchSection.filter((section) => allowedSections.includes(section)),
      product: watchProduct.filter((product) => allowedProducts.includes(product)),
      model: watchModel.filter((model) => allowedModels.includes(model)),
      item: watchItem.filter((item) => allowedItems.includes(item)),
    };

    if (
      pruned.purchaseBrand.length !== watchPurchaseBrand.length ||
      pruned.section.length !== watchSection.length ||
      pruned.product.length !== watchProduct.length ||
      pruned.model.length !== watchModel.length ||
      pruned.item.length !== watchItem.length
    ) {
      form.setFieldsValue(pruned);
    }
  }, [
    brand_hierarchy,
    computeBrandOptions,
    form,
    optionsLoaded,
    watchItem,
    watchModel,
    watchProduct,
    watchPurchaseBrand,
    watchSection,
  ]);

  const onFinish = async (values: FormValues) => {
    const [startMoment, endMoment] = values.campaignPeriod || [];
    const payload: Record<string, unknown> = {
      name: values.name,
      start_date: startMoment?.format("YYYY-MM-DD"),
      end_date: endMoment?.format("YYYY-MM-DD"),
      based_on: values.basedOn,
    };

     if (values.basedOn !== "upload") {
      Object.assign(payload, {
        recency_op: values.recencyOp,
        recency_min: values.recencyMin,
        recency_max: values.recencyOp === "between" ? values.recencyMax : values.recencyMin,
        frequency_op: values.frequencyOp,
        frequency_min: values.frequencyMin,
        frequency_max:
          values.frequencyOp === "between" ? values.frequencyMax : values.frequencyMin,
        monetary_op: values.monetaryOp,
        monetary_min: values.monetaryMin,
        monetary_max: values.monetaryOp === "between" ? values.monetaryMax : values.monetaryMin,
        r_score: values.rScore,
        f_score: values.fScore,
        m_score: values.mScore,
        rfm_segments: values.rfmSegment,
        branch: values.branch,
        city: values.city,
        state: values.state,
        birthday_start: values.birthdayRange?.[0]?.format("YYYY-MM-DD"),
        birthday_end: values.birthdayRange?.[1]?.format("YYYY-MM-DD"),
        anniversary_start: values.anniversaryRange?.[0]?.format("YYYY-MM-DD"),
        anniversary_end: values.anniversaryRange?.[1]?.format("YYYY-MM-DD"),
        purchase_brand: values.purchaseBrand,
        section: values.section,
        product: values.product,
        model: values.model,
        item: values.item,
        value_threshold: values.valueThreshold,
      });

      if (values.purchaseType?.anyPurchase) {
        payload.purchase_type = "any";
      }
      if (values.purchaseType?.recentPurchase) {
        payload.purchase_type = "recent";
      }

      if (values.rfmMode?.customized) {
        payload.rfm_mode = "customized";
      }
      if (values.rfmMode?.segmented) {
        payload.rfm_mode = "segmented";
      }
    } else {
      Object.assign(payload, {
        recency_op: "=",
        frequency_op: "=",
        monetary_op: "=",
      });
    }

    try {
      let resp;
      if (campaignId) {
        resp = await api.put(`/campaign/${campaignId}`, payload);
        message.success("Campaign updated successfully");
      } else {
        resp = await api.post("/campaign/createCampaign", payload);
        message.success("Campaign saved successfully");
        form.resetFields();
          form.setFieldsValue({
          basedOn: "Customer Base",
          rfmMode: { customized: true, segmented: false },
          purchaseType: { anyPurchase: true, recentPurchase: false },
        });
      }

      const newId = campaignId || resp?.data?.id;
      if (!newId) {
        message.error("Campaign save was not successful. Please try again.");
        return;
      }

      if (values.basedOn === "upload" && uploadFile) {
        try {
          const formData = new FormData();
          formData.append("file", uploadFile);
          await api.post(`/campaign/${newId}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          message.success("Contacts uploaded");
        } catch (uploadErr: any) {
          console.error("Upload failed:", uploadErr?.response?.data || uploadErr);
          if (!campaignId) {
            try {
              await api.delete(`/campaign/${newId}`);
              message.error("Upload failed. Campaign has been reverted.");
            } catch (rollbackErr: any) {
              console.error("Rollback failed:", rollbackErr?.response?.data || rollbackErr);
              message.error(
                "Upload failed, and rollback could not be completed. Please check manually."
              );
            }
          } else {
            message.error("Upload failed. Campaign not reverted since it was an update.");
          }
        }
      }
    } catch (err: any) {
       console.error("Save failed:", err?.response?.data || err);
      message.error("Failed to save campaign");
    }
  };

  const handleCheckAndCreate = async () => {
    try {
       const values: FormValues = form.getFieldsValue();
      const payload = {
        ...values,
        birthday_start: values.birthdayRange?.[0]?.format("YYYY-MM-DD"),
        birthday_end: values.birthdayRange?.[1]?.format("YYYY-MM-DD"),
        anniversary_start: values.anniversaryRange?.[0]?.format("YYYY-MM-DD"),
        anniversary_end: values.anniversaryRange?.[1]?.format("YYYY-MM-DD"),
      };

      const res = await axios.post("/api/campaign/run/count", payload);
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
         onOk: () => {
          form.submit();
        },
        onCancel: () => {
          message.info("You can edit filters before creating the campaign.");
        },
      });
     } catch (err) {
      console.error(err);
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
      const allowed = useMemo(() => optionsProvider(), [optionsProvider]);
    const selected: string[] = Form.useWatch(name, form) || [];
    const ALL = "__ALL__";

    const handleChange = (vals: string[]) => {
      if (vals.includes(ALL) && !selected.includes(ALL)) {
        form.setFieldsValue({ [name]: allowed });
        return;
      }
       form.setFieldsValue({ [name]: vals.filter((val) => val !== ALL) });
    };

    const isAllSelected = allowed.length > 0 && selected.length === allowed.length;

    return (
     <Form.Item name={name as keyof FormValues} label={label} style={{ marginBottom: 8 }}>
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
           menuItemSelectedIcon={(info) => <Checkbox checked={info?.isSelected} />}
          optionRender={(option) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox checked={selected.includes(option.value as string)} />
              <span>{option.label}</span>
            </div>
          )}
          options={[
            { label: isAllSelected ? "All (selected)" : "All", value: ALL },
            ...allowed.map((value) => ({ label: value, value })),
          ]}
           filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
          }
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
              <RangePicker
                style={{ width: "100%" }}
                disabledDate={(currentDate) => {
                  const dates = form.getFieldValue("campaignPeriod");
                  if (!dates) return false;

                  const [start, end] = dates;
                  if (start && !end) {
                    return currentDate && currentDate < start.startOf("day");
                  }

                  if (end && !start) {
                    return currentDate && currentDate > end.endOf("day");
                  }

                  return false;
                }}
              />
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
                 <Radio value="Customer Base" style={{ maxWidth: 200 }}>
                  Customer Base
                </Radio>
                <Radio value="upload" style={{ maxWidth: 200 }}>
                  Upload
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {watchBasedOn === "Customer Base" && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.city !== cur.city || prev.state !== cur.state}
                >
                  {() => (
                    <MultiSelectDropdown
                      name="branch"
                      label="Branch"
                      placeholder="Select branches"
                      optionsProvider={() => computeGeoOptions().allowedBranches}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.branch !== cur.branch || prev.state !== cur.state}
                >
                  {() => (
                    <MultiSelectDropdown
                      name="city"
                      label="City"
                      placeholder="Select cities"
                      optionsProvider={() => computeGeoOptions().allowedCities}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.branch !== cur.branch || prev.city !== cur.city}
                >
                  {() => (
                    <MultiSelectDropdown
                      name="state"
                      label="State"
                      placeholder="Select states"
                      optionsProvider={() => computeGeoOptions().allowedStates}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Form.Item style={{ marginBottom: 8 }}>
                  <Space>
                    <Form.Item
                      name={["rfmMode", "customized"]}
                      valuePropName="checked"
                      noStyle
                    >
                      <Switch
                        onChange={(checked) => {
                          if (checked) {
                            const current = form.getFieldValue("rfmMode") || {};
                            form.setFieldsValue({
                              rfmMode: { ...current, customized: true, segmented: false },
                            });
                          }
                        }}
                      />
                    </Form.Item>
                    <span>RFM Customized</span>

                    <Form.Item
                      name={["rfmMode", "segmented"]}
                      valuePropName="checked"
                      noStyle
                    >
                      <Switch
                        onChange={(checked) => {
                          const current = form.getFieldValue("rfmMode") || {};
                          form.setFieldsValue({
                            rfmMode: {
                              ...current,
                              customized: checked ? false : current.customized,
                              segmented: checked,
                            },
                          });
                        }}
                      />
                    </Form.Item>
                    <span>RFM Segmented</span>
                  </Space>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.rfmMode !== cur.rfmMode}>
              {({ getFieldValue }) => {
                const rfmMode = (getFieldValue("rfmMode") || {}) as RfmModeFormValue;
                const isCustomized = rfmMode.customized === true;
                const isSegmented = rfmMode.segmented === true;

                return (
                  <>
                    {isCustomized && (
                      <Card style={{ marginTop: 5, padding: 10 }}>
                        <Row
                          gutter={8}
                          wrap={false}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Col flex="230px">
                            <Form.Item label="Recency" style={{ marginBottom: 0 }}>
                              <Input.Group compact>
                                <Form.Item name="recencyOp" noStyle>
                                  <Select style={{ width: 90 }} placeholder="Op" allowClear>
                                    <Select.Option value="=">=</Select.Option>
                                    <Select.Option value=">=">≥</Select.Option>
                                    <Select.Option value="<=">≤</Select.Option>
                                    <Select.Option value="between">Between</Select.Option>
                                  </Select>
                                </Form.Item>
                                <Form.Item noStyle dependencies={["recencyOp"]}>
                                  {({ getFieldValue: getRecency }) => {
                                    const op = getRecency("recencyOp");
                                    return op === "between" ? (
                                      <>
                                        <Form.Item name="recencyMin" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Min" />
                                        </Form.Item>
                                        <Form.Item name="recencyMax" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Max" />
                                        </Form.Item>
                                      </>
                                    ) : (
                                      <Form.Item name="recencyMin" noStyle>
                                        <InputNumber style={{ width: 120 }} placeholder="Value" />
                                      </Form.Item>
                                    );
                                  }}
                                </Form.Item>
                              </Input.Group>
                            </Form.Item>
                          </Col>

                          <Col flex="230px">
                            <Form.Item label="Frequency" style={{ marginBottom: 0 }}>
                              <Input.Group compact>
                                <Form.Item name="frequencyOp" noStyle>
                                  <Select style={{ width: 90 }} placeholder="Op" allowClear>
                                    <Select.Option value="=">=</Select.Option>
                                    <Select.Option value=">=">≥</Select.Option>
                                    <Select.Option value="<=">≤</Select.Option>
                                    <Select.Option value="between">Between</Select.Option>
                                  </Select>
                                </Form.Item>
                                <Form.Item noStyle dependencies={["frequencyOp"]}>
                                  {({ getFieldValue: getFrequency }) => {
                                    const op = getFrequency("frequencyOp");
                                    return op === "between" ? (
                                      <>
                                        <Form.Item name="frequencyMin" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Min" />
                                        </Form.Item>
                                        <Form.Item name="frequencyMax" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Max" />
                                        </Form.Item>
                                      </>
                                    ) : (
                                      <Form.Item name="frequencyMin" noStyle>
                                        <InputNumber style={{ width: 120 }} placeholder="Value" />
                                      </Form.Item>
                                    );
                                  }}
                                </Form.Item>
                              </Input.Group>
                            </Form.Item>
                          </Col>

                          <Col flex="230px">
                            <Form.Item label="Monetary (₹)" style={{ marginBottom: 0 }}>
                              <Input.Group compact>
                                <Form.Item name="monetaryOp" noStyle>
                                  <Select style={{ width: 90 }} placeholder="Op" allowClear>
                                    <Select.Option value="=">=</Select.Option>
                                    <Select.Option value=">=">≥</Select.Option>
                                    <Select.Option value="<=">≤</Select.Option>
                                    <Select.Option value="between">Between</Select.Option>
                                  </Select>
                                </Form.Item>
                                <Form.Item noStyle dependencies={["monetaryOp"]}>
                                  {({ getFieldValue: getMonetary }) => {
                                    const op = getMonetary("monetaryOp");
                                    return op === "between" ? (
                                      <>
                                        <Form.Item name="monetaryMin" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Min" formatter={(value) => `₹ ${value}`} />
                                        </Form.Item>
                                        <Form.Item name="monetaryMax" noStyle>
                                          <InputNumber style={{ width: 60 }} placeholder="Max" formatter={(value) => `₹ ${value}`} />
                                        </Form.Item>
                                      </>
                                    ) : (
                                      <Form.Item name="monetaryMin" noStyle>
                                        <InputNumber
                                          style={{ width: 120 }}
                                          placeholder="Value"
                                          formatter={(value) => `₹ ${value}`}
                                        />
                                      </Form.Item>
                                    );
                                  }}
                                </Form.Item>
                              </Input.Group>
                            </Form.Item>
                          </Col>

                          <Col flex="160px">
                            <Form.Item name="rScore" label="R-Score" style={{ marginBottom: 0 }}>
                              <Select mode="multiple" placeholder="R" maxTagCount={1} allowClear>
                                {r_scores.map((score) => (
                                  <Option key={score} value={score}>
                                    {score}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col flex="160px">
                            <Form.Item name="fScore" label="F-Score" style={{ marginBottom: 0 }}>
                              <Select mode="multiple" placeholder="F" maxTagCount={1} allowClear>
                                {f_scores.map((score) => (
                                  <Option key={score} value={score}>
                                    {score}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col flex="160px">
                            <Form.Item name="mScore" label="M-Score" style={{ marginBottom: 0 }}>
                              <Select mode="multiple" placeholder="M" maxTagCount={1} allowClear>
                                {m_scores.map((score) => (
                                  <Option key={score} value={score}>
                                    {score}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {isSegmented && (
                      <Form.Item
                        name="rfmSegment"
                        rules={[{ required: true, message: "Select at least one segment" }]}
                        style={{ marginTop: 10 }}
                      >
                        <Select mode="multiple" placeholder="Select Segment" allowClear style={{ width: "100%" }}>
                          {rfm_segments.map((segment) => (
                            <Option key={segment} value={segment}>
                              {segment}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                  </>
                );
              }}
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.rfmMode !== cur.rfmMode}>
              {({ getFieldValue }) => {
                const mode = (getFieldValue("rfmMode") || {}) as RfmModeFormValue;
                return (
                  <Form.Item
                    name="purchaseType"
                    label="Purchase Type"
                    rules={
                      requirePurchaseType
                        ? [{ required: true, message: "Please select a Purchase Type" }]
                        : []
                    }
                  >
                    <Space>
                      <span>Any Purchase</span>
                      <Form.Item name={["purchaseType", "anyPurchase"]} valuePropName="checked" noStyle>
                        <Switch disabled={watchBasedOn === "upload"} />
                      </Form.Item>

                      <span>Recent Purchase</span>
                      <Form.Item name={["purchaseType", "recentPurchase"]} valuePropName="checked" noStyle>
                        <Switch disabled={watchBasedOn === "upload"} />
                      </Form.Item>
                    </Space>
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Row
              gutter={8}
              wrap={false}
              style={{
                display: "flex",
                alignItems: "flex-end",
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              <Col flex="200px">
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) =>
                    prev.section !== cur.section ||
                    prev.product !== cur.product ||
                    prev.model !== cur.model ||
                    prev.item !== cur.item
                  }
                >
                  {() => (
                    <MultiSelectDropdown
                      name="purchaseBrand"
                      label="Brand"
                      placeholder="Select brands"
                      optionsProvider={() => computeBrandOptions().allowedBrands}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>

              <Col flex="200px">
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) =>
                    prev.purchaseBrand !== cur.purchaseBrand ||
                    prev.product !== cur.product ||
                    prev.model !== cur.model ||
                    prev.item !== cur.item
                  }
                >
                  {() => (
                    <MultiSelectDropdown
                      name="section"
                      label="Section"
                      placeholder="Select sections"
                      optionsProvider={() => computeBrandOptions().allowedSections}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>

              <Col flex="200px">
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) =>
                    prev.purchaseBrand !== cur.purchaseBrand ||
                    prev.section !== cur.section ||
                    prev.model !== cur.model ||
                    prev.item !== cur.item
                  }
                >
                  {() => (
                    <MultiSelectDropdown
                      name="product"
                      label="Product"
                      placeholder="Select products"
                      optionsProvider={() => computeBrandOptions().allowedProducts}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>

              <Col flex="200px">
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) =>
                    prev.purchaseBrand !== cur.purchaseBrand ||
                    prev.section !== cur.section ||
                    prev.product !== cur.product ||
                    prev.item !== cur.item
                  }
                >
                  {() => (
                    <MultiSelectDropdown
                      name="model"
                      label="Model"
                      placeholder="Select models"
                      optionsProvider={() => computeBrandOptions().allowedModels}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>

              <Col flex="200px">
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) =>
                    prev.purchaseBrand !== cur.purchaseBrand ||
                    prev.section !== cur.section ||
                    prev.product !== cur.product ||
                    prev.model !== cur.model
                  }
                >
                  {() => (
                    <MultiSelectDropdown
                      name="item"
                      label="Item"
                      placeholder="Select items"
                      optionsProvider={() => computeBrandOptions().allowedItems}
                      disabled={watchBasedOn === "upload"}
                    />
                  )}
                </Form.Item>
              </Col>

              <Col flex="180px">
                <Form.Item name="valueThreshold" label="Value Threshold" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(value) => `₹ ${value}`}
                    min={0}
                    placeholder="e.g. ≥ 50000"
                    disabled={watchBasedOn === "upload"}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col flex="200px">
                <Form.Item name="birthdayRange" label="Birthday Range" style={{ marginBottom: 8 }}>
                  <RangePicker style={{ width: "100%" }} disabled={watchBasedOn === "upload"} />
                </Form.Item>
              </Col>
              <Col flex="180px">
                <Form.Item name="anniversaryRange" label="Anniversary Range" style={{ marginBottom: 0 }}>
                  <RangePicker style={{ width: "100%" }} disabled={watchBasedOn === "upload"} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {watchBasedOn === "upload" && (
          <Card title="Upload Contacts" style={{ marginTop: 10 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Link href="/api/campaign/upload/template">Download Template</Link>
                {isEditing && (
                  <>
                    <Divider type="vertical" />
                    <Text strong style={{ color: "#555" }}>
                              Do you want to download the uploaded file?
                    </Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={`/api/campaign/${campaignId}/upload/download`}
                      download={`${watchName}.xlsx`}
                      style={{ color: "#1890ff", fontWeight: 500 }}
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
