import React, { useState, useEffect, useCallback } from "react";
import { DatePicker, Select, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Treemap,
  LineChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
} from "recharts";
import type { TreemapDataType } from "recharts/types/chart/Treemap";
import "./Dashboard.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

// ---------- Constants ----------
const COLORS = ["#536d8e", "#c8a036", "#205166", "#914545", "#009292", "#583f74"];
const GRADIENTS = [
  { id: "grad1", start: "#536d8e", end: "#914545" },
  { id: "grad2", start: "#c8a036", end: "#ffdb70" },
  { id: "grad3", start: "#205166", end: "#009292" },
  { id: "grad4", start: "#583f74", end: "#8e6ccf" },
  { id: "grad5", start: "#d84a4a", end: "#ffb199" },
  { id: "grad6", start: "#1fa2ff", end: "#12d8fa" },
];

const R_LABELS: Record<number, string> = {
  5: "Bought Most Recently",
  4: "4",
  3: "3",
  2: "2",
  1: "Bought Long Time Ago",
};
const F_LABELS: Record<number, string> = {
  5: "More Frequent Visit",
  4: "4",
  3: "3",
  2: "2",
  1: "Most Rarest Visit",
};
const M_LABELS: Record<number, string> = {
  5: "Spend More on Purchase",
  4: "4",
  3: "3",
  2: "2",
  1: "Spend Less on Purchase",
};

// ---------- Types ----------
interface DashboardRow {
  R_SCORE: number;
  F_SCORE: number;
  M_SCORE: number;
  R_VALUE?: number;
  F_VALUE?: number;
  M_VALUE?: number;
  GROSS_PROFIT?: number;
  NO_OF_ITEMS?: number;
  DAYS?: number;
}

interface ChartItem {
  name: string;
  value: number;
}

interface BarItem {
  [key: string]: string | number;
}

type SegmentItem = TreemapDataType & {
  name: string;
  value: number;
 
};

interface CustomerPercentItem {
  year: string;
  newCustomer: number;
  oldCustomer: number;
}

interface Filters {
  phone: string;
  name: string;
  r_score: string;
  f_score: string;
  m_score: string;
}

// ---------- Component ----------
const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    phone: "",
    name: "",
    r_score: "",
    f_score: "",
    m_score: "",
  });

  const [phones, setPhones] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [rValues, setRValues] = useState<string[]>([]);
  const [fValues, setFValues] = useState<string[]>([]);
  const [mValues, setMValues] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [metricData, setMetricData] = useState({
    totalCustomers: 0,
    unitsPerTxn: 0,
    profitPerCustomer: 0,
    customerSpending: 0,
    daysToReturn: 0,
    retentionRate: 0,
  });

  const [pieDataR, setPieDataR] = useState<ChartItem[]>([]);
  const [pieDataF, setPieDataF] = useState<ChartItem[]>([]);
  const [pieDataM, setPieDataM] = useState<ChartItem[]>([]);
  const [barDataR, setBarDataR] = useState<BarItem[]>([]);
  const [barDataVisits, setBarDataVisits] = useState<BarItem[]>([]);
  const [barDataValue, setBarDataValue] = useState<BarItem[]>([]);
  const [segmentData, setSegmentData] = useState<SegmentItem[]>([]);
  const [daysBucketData, setDaysBucketData] = useState<BarItem[]>([]);
  const [customerPercentData, setCustomerPercentData] = useState<CustomerPercentItem[]>([]);

  // ---------- Fetch filters ----------
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get("/api/filters");
        const {
          phones: phoneList = [],
          names: nameList = [],
          r_values: rList = [],
          f_values: fList = [],
          m_values: mList = [],
        } = res.data || {};

        setPhones(phoneList);
        setNames(nameList);
        setRValues(rList);
        setFValues(fList);
        setMValues(mList);
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  // ---------- Utility ----------
  const countBy = (rows: DashboardRow[], key: keyof DashboardRow) => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const val = r[key];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        counts[strVal] = (counts[strVal] || 0) + 1;
      }
    });
    return counts;
  };

  const objectEntriesToArray = (obj: Record<string, number>, keyName: string): BarItem[] =>
    Object.entries(obj).map(([key, value]) => ({ [keyName]: key, value }));

  // ---------- Compute Metrics ----------
  const computeMetrics = (rows: DashboardRow[]) => {
    if (!rows?.length) return;

    const totalCustomers = rows.length;
    const totalItems = rows.reduce((sum, r) => sum + (r.NO_OF_ITEMS || 0), 0);
    const totalTransactions = rows.reduce((sum, r) => sum + (r.F_VALUE || 0), 0);

    const unitsPerTxn = totalTransactions ? +(totalItems / totalTransactions).toFixed(2) : 0;
    const profitPerCustomer = totalCustomers
      ? +(rows.reduce((s, r) => s + (r.GROSS_PROFIT || 0), 0) / totalCustomers).toFixed(2)
      : 0;
    const customerSpending = totalCustomers
      ? +(rows.reduce((s, r) => s + (r.M_VALUE || 0), 0) / totalCustomers).toFixed(2)
      : 0;
    const daysToReturn = totalCustomers
      ? +(rows.reduce((s, r) => s + (r.DAYS || 0), 0) / totalCustomers).toFixed(2)
      : 0;
    const retentionRate = totalCustomers
      ? +((rows.filter((r) => (r.F_VALUE || 0) > 1).length / totalCustomers) * 100).toFixed(2)
      : 0;

    setMetricData({
      totalCustomers,
      unitsPerTxn,
      profitPerCustomer,
      customerSpending,
      daysToReturn,
      retentionRate,
    });

    const makePieData = (counts: Record<string, number>, labels: Record<number, string>) =>
      Object.keys(counts)
        .map(Number)
        .sort((a, b) => b - a)
        .map((score) => ({
          name: labels[score] ?? String(score),
          value: counts[String(score)],
        }));

    setPieDataR(makePieData(countBy(rows, "R_SCORE"), R_LABELS));
    setPieDataF(makePieData(countBy(rows, "F_SCORE"), F_LABELS));
    setPieDataM(makePieData(countBy(rows, "M_SCORE"), M_LABELS));

    // ---------- Bar chart buckets ----------
    const rBuckets: Record<string, number> = {
      "1-200": 0,
      "200-400": 0,
      "400-600": 0,
      "600-800": 0,
      "800-1000": 0,
      ">1000": 0,
    };

    rows.forEach(({ R_VALUE }) => {
      const v = R_VALUE || 0;
      if (v <= 200) rBuckets["1-200"]++;
      else if (v <= 400) rBuckets["200-400"]++;
      else if (v <= 600) rBuckets["400-600"]++;
      else if (v <= 800) rBuckets["600-800"]++;
      else if (v <= 1000) rBuckets["800-1000"]++;
      else rBuckets[">1000"]++;
    });

    setBarDataR(objectEntriesToArray(rBuckets, "bucket"));

    const visitsCounts: Record<string, number> = {};
    rows.forEach(({ F_VALUE }) => {
      const v = F_VALUE || 0;
      visitsCounts[v] = (visitsCounts[v] || 0) + 1;
    });

    setBarDataVisits(objectEntriesToArray(visitsCounts, "visits"));

    const valueBuckets: Record<string, number> = {
      "1-1000": 0,
      "1000-2000": 0,
      "2000-3000": 0,
      "3000-4000": 0,
      "4000-5000": 0,
      ">5000": 0,
    };

    rows.forEach(({ M_VALUE }) => {
      const v = M_VALUE || 0;
      if (v <= 1000) valueBuckets["1-1000"]++;
      else if (v <= 2000) valueBuckets["1000-2000"]++;
      else if (v <= 3000) valueBuckets["2000-3000"]++;
      else if (v <= 4000) valueBuckets["3000-4000"]++;
      else if (v <= 5000) valueBuckets["4000-5000"]++;
      else valueBuckets[">5000"]++;
    });

    setBarDataValue(objectEntriesToArray(valueBuckets, "range"));
  };

  // ---------- Apply Filters ----------
  const applyFilters = useCallback(async () => {
    const params: Record<string, string> = {};

    Object.entries(filters).forEach(([key, val]) => {
      if (val) params[key] = val;
    });

    if (dateRange?.[0] && dateRange?.[1]) {
      params.start_date = dateRange[0].format("YYYY-MM-DD");
      params.end_date = dateRange[1].format("YYYY-MM-DD");
    }

    try {
      const [res, chartsRes] = await Promise.all([
        axios.get<DashboardRow[]>("/api/dashboard/", { params }),
        axios.get("/api/dashboard/last_three_charts", { params }),
      ]);

      computeMetrics(res.data);
      setSegmentData(chartsRes.data.segmentData || []);
      setDaysBucketData(chartsRes.data.daysBucketData || []);
      setCustomerPercentData(chartsRes.data.customerPercentData || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  }, [filters, dateRange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ---------- Render ----------
  return (
    <div className="rfm-dashboard">
      {/* Filters */}
      <div className="filters">
        <div className="filter-item">
          <label>Date Range:</label>
          <RangePicker value={dateRange ?? null} onChange={(dates) => setDateRange(dates)} />
        </div>

        {[
          { label: "Customer Mobile No", key: "phone", list: phones },
          { label: "Customer Name", key: "name", list: names },
          { label: "R Value Bucket", key: "r_score", list: rValues },
          { label: "F Value Bucket", key: "f_score", list: fValues },
          { label: "M Value Bucket", key: "m_score", list: mValues },
        ].map(({ label, key, list }) => (
          <div key={key} className="filter-item">
            <label>{label}:</label>
            <Select
              placeholder={label}
              className="filter-select"
              value={filters[key as keyof Filters]}
              onChange={(value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            >
              <Option value="">All</Option>
              {list.map((v) => (
                <Option key={v} value={v}>
                  {v}
                </Option>
              ))}
            </Select>
          </div>
        ))}

        <Button type="primary" onClick={applyFilters}>
          Apply Filter
        </Button>
      </div>

      {/* Metrics */}
      <div className="metrics1">
        {[
          { label: "Total Customer", value: metricData.totalCustomers.toLocaleString() },
          { label: "Unit Per Transaction", value: metricData.unitsPerTxn },
          { label: "Profit Per Customer", value: metricData.profitPerCustomer },
          { label: "Customer Spending", value: metricData.customerSpending },
          { label: "Days to Return", value: metricData.daysToReturn },
          { label: "Retention Rate", value: `${metricData.retentionRate}%` },
        ].map((m, idx) => (
          <div key={idx} className="metric-card">
            <h4>{m.label}</h4>
            <p>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts">
        {/* R Score Pie */}
        <div className="chart-container">
          <h4>Total Customer by R Score</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <defs>
                {GRADIENTS.map((g) => (
                  <linearGradient id={g.id} key={g.id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={g.start} />
                    <stop offset="100%" stopColor={g.end} />
                  </linearGradient>
                ))}
              </defs>
              <Pie data={pieDataR} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                {pieDataR.map((_, index) => (
                  <Cell key={index} fill={`url(#grad${(index % GRADIENTS.length) + 1})`} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* F Score Pie */}
        <div className="chart-container">
          <h4>Total Customer by F Score</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieDataF} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                {pieDataF.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* M Score Pie */}
        <div className="chart-container">
          <h4>Total Customer by M Score</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieDataM} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                {pieDataM.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Total Customer by R Value Bucket (Days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barDataR} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 30 }} >
              <XAxis type="number" dataKey="value"
                  domain={[0, 'dataMax']}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Total Customer', 
                    position: 'bottom', 
                    offset: 0 
                  }} />
              <YAxis dataKey="bucket" type="category"
              width={120}
              tick={{ fontSize: 12 }}
              label={{
                value: 'R value Bucket (Days)',
                angle: -90,
                position: 'right',   // move it outside the axis
                dx: -90,            // shift it further left into the margin
                dy: 90               // no vertical shift
              }}/>
              <Tooltip />
              <Bar dataKey="value">
                {barDataR.map((entry, index) => (
                  <Cell key={`cell-bar-r-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h4>Total Customer by No. of Visits</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barDataVisits} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 30 }} >
              {/* <XAxis type="number" />
              <YAxis dataKey="visits" type="category" /> */}
                  <XAxis
                    type="number"
                    dataKey="value"
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Total Customer', position: 'bottom', offset: 0 }}
                  />
                  <YAxis
                    dataKey="visits"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'No. of Visits', angle: -90, 
                      position: 'right',   // move it outside the axis
                      dx: -90,            // shift it further left into the margin
                      dy: 50               // no vertical shift
                    
                    }}
                  />
              <Tooltip />
              <Bar dataKey="value">
                {barDataVisits.map((entry, index) => (
                  <Cell key={`cell-bar-v-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h4>Total Customer by Value</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barDataValue} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 30 }} >
              {/* <XAxis type="number" />
              <YAxis dataKey="range" type="category" /> */}
              <XAxis
                type="number"
                dataKey="value"
                domain={[0, 'dataMax']}
                tick={{ fontSize: 12 }}
                label={{ value: 'Total Customer', position: 'bottom', offset: 0 }}
              />
              <YAxis
                dataKey="range"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
                label={{ value: 'Value', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip />
              <Bar dataKey="value">
                {barDataValue.map((entry, index) => (
                  <Cell key={`cell-bar-val-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* <div className="charts grid grid-cols-3 gap-4 items-start"> */}
            {/* ── Total Customer by Segment ───────────────────────── */}
            <div className="chart-container">
              <h4>Total Customer by Segment</h4>
              <ResponsiveContainer width="100%" height={300}>
                 <Treemap
                    data={segmentData}
                    dataKey="value"
                    nameKey="name"
                    aspectRatio={4 / 3}
                    content={({ name, value }) => (
                    <text
                        x={0}
                        y={0}
                        fill="#000"
                        fontSize={12}
                        fontWeight="bold"
                        textAnchor="middle"
                    >
                        {`${name}: ${value}`}
                    </text>
                    )}
                />
              </ResponsiveContainer>
            </div>

            {/* ── Days to Return Bucket ────────────────────────────── */}
            <div className="chart-container">
              <h4>Days to Return Bucket</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={daysBucketData}>
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1E8449" />
                </BarChart>
              </ResponsiveContainer>
            </div>
        {/* </div> */}
        {/* ── Current Vs New Customer % (FY) ───────────────────────── */}
          <div className="chart-container col-span-3">
            <h4>Current Vs New Customer % (FY)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={customerPercentData}
                margin={{ top: 20, right: 50, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                {/* Left axis for New Customer % */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  label={{
                    value: 'New Customer %',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                {/* Right axis for Old Customer % */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  label={{
                    value: 'Old Customer %',
                    angle: 90,
                    position: 'insideRight'
                  }}
                />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="newCustomer"
                  name="New Customer %"
                  stroke="#28a745"
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="oldCustomer"
                  name="Old Customer %"
                  stroke="#333"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
