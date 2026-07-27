"use client";

import { ArrowLeftOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { inferRouterOutputs } from "@trpc/server";
import { Button, Input, Select, Space, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import Link from "next/link";
import { useMemo, useState } from "react";
import { trpc } from "src/server/trpc/api";
import type { AppRouter } from "src/server/trpc/router";
import styled from "styled-components";

type PricePinItem = inferRouterOutputs<AppRouter>["fund"]["listPricePins"]["items"][number];
type PricePinType = PricePinItem["pinType"];
type SortField = "pinDate" | "fundCode" | "highDeviationPercent" | "lowDeviationPercent";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 50;
const sortableFields = ["pinDate", "fundCode", "highDeviationPercent", "lowDeviationPercent"] as const;

function formatNumber(value: number | null | undefined, digits = 4) {
  if (value === null || value === undefined) return "--";
  return value.toFixed(digits);
}

function formatPercent(value: number | null | undefined, options?: { signed?: boolean }) {
  if (value === null || value === undefined) return "--";
  const sign = options?.signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function toneClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

function pinTypeLabel(value: PricePinType) {
  if (value === "HIGH") return "上插针";
  if (value === "LOW") return "下插针";
  return "双向插针";
}

function pinTypeColor(value: PricePinType) {
  if (value === "HIGH") return "red";
  if (value === "LOW") return "green";
  return "gold";
}

function toApiSortOrder(order: SorterResult<PricePinItem>["order"]): SortOrder | undefined {
  if (order === "ascend") return "asc";
  if (order === "descend") return "desc";
  return undefined;
}

function toTableSortOrder(field: SortField, sortField?: SortField, sortOrder?: SortOrder) {
  if (field !== sortField) return null;
  return sortOrder === "asc" ? "ascend" : "descend";
}

function isSortField(value: unknown): value is SortField {
  return sortableFields.includes(value as SortField);
}

export default function FundPricePinPage() {
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pinType, setPinType] = useState<PricePinType>();
  const [needle, setNeedle] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();

  const query = trpc.fund.listPricePins.useQuery({
    page,
    pageSize: PAGE_SIZE,
    keyword: searchKeyword || undefined,
    pinType,
    needle,
    sortField,
    sortOrder,
  }, {
    refetchInterval: 60000,
  });

  const columns = useMemo<ColumnsType<PricePinItem>>(() => [
    {
      title: "插针日期",
      dataIndex: "pinDate",
      width: 112,
      sorter: true,
      sortOrder: toTableSortOrder("pinDate", sortField, sortOrder),
      render: (value: string | null) => <span className="strong">{value || "--"}</span>,
    },
    {
      title: "基金代码",
      dataIndex: "fundCode",
      width: 96,
      sorter: true,
      sortOrder: toTableSortOrder("fundCode", sortField, sortOrder),
      render: (value: string) => <span className="code">{value}</span>,
    },
    {
      title: "基金名称",
      dataIndex: "fundName",
      width: 180,
      render: (value: string) => <span className="fund-name">{value}</span>,
    },
    {
      title: "出现次数",
      dataIndex: "occurrenceCount",
      width: 96,
      align: "right",
    },
    {
      title: "类型",
      dataIndex: "pinType",
      width: 92,
      align: "center",
      render: (value: PricePinType) => <Tag color={pinTypeColor(value)}>{pinTypeLabel(value)}</Tag>,
    },
    {
      title: "针",
      dataIndex: "needle",
      width: 72,
      align: "center",
      render: (value: boolean) => <Tag color={value ? "purple" : "default"}>{value ? "是" : "否"}</Tag>,
    },
    {
      title: "开盘价",
      dataIndex: "openPrice",
      width: 96,
      align: "right",
      render: (value: number | null) => formatNumber(value),
    },
    {
      title: "收盘价",
      dataIndex: "closePrice",
      width: 96,
      align: "right",
      render: (value: number | null) => formatNumber(value),
    },
    {
      title: "最高价",
      dataIndex: "highPrice",
      width: 96,
      align: "right",
      render: (value: number | null) => formatNumber(value),
    },
    {
      title: "最低价",
      dataIndex: "lowPrice",
      width: 96,
      align: "right",
      render: (value: number | null) => formatNumber(value),
    },
    {
      title: "最高偏离",
      dataIndex: "highDeviationPercent",
      width: 112,
      align: "right",
      sorter: true,
      sortOrder: toTableSortOrder("highDeviationPercent", sortField, sortOrder),
      render: (value: number | null) => (
        <span className={toneClass(value)}>{formatPercent(value, { signed: true })}</span>
      ),
    },
    {
      title: "最低偏离",
      dataIndex: "lowDeviationPercent",
      width: 112,
      align: "right",
      sorter: true,
      sortOrder: toTableSortOrder("lowDeviationPercent", sortField, sortOrder),
      render: (value: number | null) => (
        <span className={toneClass(value)}>{formatPercent(value, { signed: true })}</span>
      ),
    },
    {
      title: "阈值",
      dataIndex: "thresholdPercent",
      width: 80,
      align: "right",
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: "针阈值",
      dataIndex: "needleThresholdPercent",
      width: 88,
      align: "right",
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: "数据源",
      dataIndex: "source",
      width: 92,
      render: (value: string | null) => value || "--",
    },
    {
      title: "检测时间",
      dataIndex: "detectedAt",
      width: 176,
      render: (value: string | null) => formatDateTime(value),
    },
  ], [sortField, sortOrder]);

  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword.trim());
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<PricePinItem> | SorterResult<PricePinItem>[],
  ) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextField = nextSorter?.field;
    const nextOrder = toApiSortOrder(nextSorter?.order);

    setPage(pagination.current ?? 1);
    if (isSortField(nextField) && nextOrder) {
      setSortField(nextField);
      setSortOrder(nextOrder);
    } else {
      setSortField(undefined);
      setSortOrder(undefined);
    }
  };

  return (
    <PageShell>
      <TopBar>
        <Link href="/fund" passHref legacyBehavior>
          <Button icon={<ArrowLeftOutlined />}>实时监控</Button>
        </Link>
        <Brand>插针基金</Brand>
        <SearchBox
          allowClear
          value={keyword}
          prefix={<SearchOutlined />}
          placeholder="搜索代码或名称"
          onChange={(event) => setKeyword(event.target.value)}
          onPressEnter={handleSearch}
        />
        <Space size={10} className="actions">
          <Select
            allowClear
            size="small"
            placeholder="插针类型"
            value={pinType}
            style={{ width: 120 }}
            options={[
              { label: "上插针", value: "HIGH" as PricePinType },
              { label: "下插针", value: "LOW" as PricePinType },
              { label: "双向插针", value: "BOTH" as PricePinType },
            ]}
            onChange={(value) => {
              setPage(1);
              setPinType(value);
            }}
          />
          <Select
            allowClear
            size="small"
            placeholder="是否为针"
            value={needle}
            style={{ width: 110 }}
            options={[
              { label: "是", value: true },
              { label: "否", value: false },
            ]}
            onChange={(value) => {
              setPage(1);
              setNeedle(value);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>
            刷新
          </Button>
        </Space>
      </TopBar>

      <TableWrap>
        <Table
          rowKey="id"
          size="small"
          loading={query.isLoading || query.isFetching}
          dataSource={query.data?.items ?? []}
          columns={columns}
          onChange={handleTableChange}
          scroll={{ x: 1722, y: "calc(100vh - 176px)" }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: query.data?.count ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: setPage,
          }}
        />
      </TableWrap>
    </PageShell>
  );
}

const PageShell = styled.main`
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: #050e15;
  color: #b8d8ef;
  font-family: "Noto Sans SC", Arial, sans-serif;
`;

const TopBar = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(150px, 240px) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #173047;
  background: #07131e;

  .actions {
    justify-self: end;
  }
`;

const Brand = styled.h1`
  margin: 0;
  color: #f4fbff;
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
`;

const SearchBox = styled(Input)`
  .ant-input,
  .ant-input-prefix,
  .ant-input-clear-icon {
    color: #9fc7e8;
  }

  &.ant-input-affix-wrapper {
    height: 28px;
    background: #0d1a27;
    border-color: #31506a;
    border-radius: 3px;
  }
`;

const TableWrap = styled.section`
  height: calc(100vh - 57px);
  padding: 12px 14px;

  .ant-table-wrapper,
  .ant-spin-nested-loading,
  .ant-spin-container {
    height: 100%;
  }

  .ant-table {
    background: #07131e;
    color: #d7efff;
  }

  .ant-table-thead > tr > th {
    background: #0d2234 !important;
    color: #98cbed !important;
    border-color: #1e3a53 !important;
    font-weight: 700;
  }

  .ant-table-column-sorters {
    color: #98cbed;
  }

  .ant-table-column-sorter {
    color: #5f829c;
  }

  .ant-table-column-sorter-up.active,
  .ant-table-column-sorter-down.active {
    color: #42a7ff;
  }

  .ant-table-thead th.ant-table-column-sort {
    background: #0d2234 !important;
  }

  .ant-table-tbody > tr > td {
    background: #07131e;
    color: #d7efff;
    border-color: #132b40;
  }

  .ant-table-tbody td.ant-table-column-sort {
    background: #07131e !important;
  }

  .ant-table-tbody > tr:hover > td {
    background: #0c2133 !important;
  }

  .ant-table-tbody > tr:hover > td.ant-table-column-sort {
    background: #0c2133 !important;
  }

  .ant-pagination,
  .ant-pagination-total-text,
  .ant-empty-description {
    color: #9fc7e8;
  }

  .strong,
  .code {
    color: #f4fbff;
    font-weight: 700;
  }

  .fund-name {
    color: #d7efff;
  }

  .up {
    color: #ff6f7d;
    font-weight: 700;
  }

  .down {
    color: #4ad99a;
    font-weight: 700;
  }

  .flat {
    color: #9fc7e8;
  }
`;
