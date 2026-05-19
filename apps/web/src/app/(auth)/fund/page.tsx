"use client";

import { ReloadOutlined, SearchOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import type { inferRouterOutputs } from "@trpc/server";
import { Button, Checkbox, Input, message, Space, Table, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "src/server/trpc/api";
import type { AppRouter } from "src/server/trpc/router";
import styled from "styled-components";

type FundItem = inferRouterOutputs<AppRouter>["fund"]["list"]["items"][number];

const PAGE_SIZE = 50;

const sourceLinks = ["东方财富网", "天天基金网", "新浪财经网", "百度网"];
const sortableFields = ["dailyChangePercent", "turnoverRate", "estimatedPremiumRate"] as const;

type SortField = typeof sortableFields[number];
type SortOrder = "asc" | "desc";

function formatNumber(value: number | null | undefined, digits = 3) {
  if (value === null || value === undefined) return "--";
  return value.toFixed(digits);
}

function formatWanAmount(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return (value / 10000).toFixed(2);
}

function formatWanShares(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return (value / 100).toFixed(2);
}

function formatPercent(value: number | null | undefined, options?: { signed?: boolean }) {
  if (value === null || value === undefined) return "--";
  const sign = options?.signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function toneClass(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

function toApiSortOrder(order: SorterResult<FundItem>["order"]): SortOrder | undefined {
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

export default function FundPage() {
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [currentTime, setCurrentTime] = useState("");
  const [sortField, setSortField] = useState<SortField>();
  const [sortOrder, setSortOrder] = useState<SortOrder>();

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    };
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const trpcUtils = trpc.useUtils();
  const [messageApi, messageContextHolder] = message.useMessage();
  const favoriteMutation = trpc.fund.updateFavorite.useMutation({
    onSuccess: async (_data, variables) => {
      messageApi.success(variables.favorite ? "加入自选成功" : "已移出自选");
      await trpcUtils.fund.list.invalidate();
    },
    onError: () => {
      messageApi.error("自选更新失败，请稍后重试");
    },
  });

  const query = trpc.fund.list.useQuery({
    page,
    pageSize: PAGE_SIZE,
    keyword: searchKeyword || undefined,
    favoriteOnly,
    sortField,
    sortOrder,
  }, {
    refetchInterval: 20000,
  });

  const handleToggleFavorite = (record: FundItem) => {
    favoriteMutation.mutate({ code: record.code, favorite: !record.favorite });
  };

  const columns = useMemo<ColumnsType<FundItem>>(() => [
    {
      title: "自选",
      dataIndex: "favorite",
      width: 40,
      fixed: "left",
      align: "center",
      render: (favorite: boolean, record) => (
        <button
          type="button"
          className="favorite-button"
          aria-label={favorite ? "取消自选" : "加入自选"}
          disabled={favoriteMutation.isLoading}
          onClick={(event) => {
            event.stopPropagation();
            handleToggleFavorite(record);
          }}
        >
          {favorite ? <StarFilled className="favorite active" /> : <StarOutlined className="favorite" />}
        </button>
      ),
    },
    {
      title: "基金代码",
      dataIndex: "code",
      width: 80,
      fixed: "left",
      render: (code: string) => <a className="fund-code">{code}</a>,
    },
    {
      title: "基金名称",
      dataIndex: "name",
      width: 90,
      fixed: "left",
      render: (name: string) => <span className="fund-name">{name}</span>,
    },
    {
      title: "现价",
      dataIndex: "currentPrice",
      width: 50,
      align: "right",
      render: (value: number | null) => <span className="strong">{formatNumber(value)}</span>,
    },
    {
      title: "今日涨幅(%)",
      dataIndex: "dailyChangePercent",
      width: 80,
      align: "right",
      sorter: true,
      sortOrder: toTableSortOrder("dailyChangePercent", sortField, sortOrder),
      render: (value: number | null) => (
        <span className={toneClass(value)}>{formatPercent(value, { signed: true })}</span>
      ),
    },
    {
      title: "相关指数涨幅",
      dataIndex: "indexChangePercent",
      width: 100,
      render: (value: number | null, record) => (
        <span className={toneClass(value)}>
          {record.marketIndexName ?? record.category ?? "相关指数"}
          {" "}
          {formatPercent(value, { signed: true })}
        </span>
      ),
    },
    {
      title: "实时估值",
      dataIndex: "estimatedNav",
      width: 60,
      align: "right",
      render: (value: number | null) => <span className="estimate">{formatNumber(value, 4)}</span>,
    },
    {
      title: "实时溢价率(%)",
      dataIndex: "estimatedPremiumRate",
      width: 90,
      align: "right",
      sorter: true,
      sortOrder: toTableSortOrder("estimatedPremiumRate", sortField, sortOrder),
      render: (value: number | null) => (
        <span className={toneClass(value)}>{formatPercent(value, { signed: true })}</span>
      ),
    },
    {
      title: "今日成交(万元)",
      dataIndex: "dailyVolume",
      width: 80,
      align: "right",
      render: (value: number | null) => <span className="strong">{formatWanAmount(value)}</span>,
    },
    {
      title: "场内份额(万份)",
      dataIndex: "exchangeShares",
      width: 80,
      align: "right",
      render: (value: number | null) => <span className="strong">{formatWanShares(value)}</span>,
    },
    {
      title: "净值日期",
      dataIndex: "navDate",
      width: 80,
      render: (value: string | null) => value || "--",
    },
    {
      title: "基金净值",
      dataIndex: "nav",
      width: 60,
      align: "right",
      render: (value: number | null) => <span className="strong">{formatNumber(value, 4)}</span>,
    },

    {
      title: "换手率(%)",
      dataIndex: "turnoverRate",
      width: 60,
      align: "right",
      sorter: true,
      sortOrder: toTableSortOrder("turnoverRate", sortField, sortOrder),
      render: (value: number | null) => <span className="strong">{formatPercent(value)}</span>,
    },

    {
      title: "申购费",
      dataIndex: "purchaseFee",
      width: 60,
      align: "right",
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: "7天赎回费",
      dataIndex: "redemptionFee7d",
      width: 60,
      align: "right",
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: "持有时间",
      dataIndex: "holdingPeriod",
      width: 92,
      align: "center",
      render: (value: string | null) => value || "--",
    },
    {
      title: "申购状态",
      dataIndex: "purchaseStatus",
      width: 100,
      render: (value: string | null) => <span className="status">{value || "--"}</span>,
    },
    {
      title: "基金公司",
      dataIndex: "company",
      width: 110,
      render: (value: string | null) => value || "--",
    },

  ], [favoriteMutation.isLoading, sortField, sortOrder]);

  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword.trim());
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<FundItem> | SorterResult<FundItem>[],
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
      {messageContextHolder}
      <TopBar>
        <Brand>LOF 基金实时监控</Brand>
        <SourceNav>
          {sourceLinks.map((name) => (
            <Button key={name} size="small" type="primary" ghost>
              {name}
            </Button>
          ))}
        </SourceNav>
        <Clock>{currentTime}</Clock>
        <SearchBox
          allowClear
          value={keyword}
          prefix={<SearchOutlined />}
          placeholder="搜索代码或名称"
          onChange={(event) => setKeyword(event.target.value)}
          onPressEnter={handleSearch}
        />
        <Space size={10} className="actions">
          <Tag color="success">交易中</Tag>
          <Checkbox
            checked={favoriteOnly}
            onChange={(event) => {
              setPage(1);
              setFavoriteOnly(event.target.checked);
            }}
          >
            只看自选
          </Checkbox>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()}>
            手动刷新
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
          scroll={{ x: 1780, y: "calc(100vh - 176px)" }}
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

const Brand = styled.h1`
  margin: 0;
  color: #f4fbff;
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
`;

const SourceNav = styled.div`
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
`;

const Clock = styled.div`
  justify-self: center;
  color: #42a7ff;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
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

const TopBar = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr minmax(240px, 320px) auto;
  gap: 12px;
  align-items: center;
  height: 42px;
  padding: 0 16px;
  border-bottom: 1px solid #1d3346;
  background: #050e15;

  .actions {
    color: #c9dff0;
    white-space: nowrap;
  }

  .ant-checkbox-wrapper {
    color: #c9dff0;
  }

  .ant-btn {
    height: 27px;
    border-color: #1f74b8;
    color: #68bfff;
    background: #071523;
    border-radius: 3px;
    font-size: 12px;
    line-height: 1;
    padding: 0 10px;
  }

  ${SourceNav} .ant-btn {
    border-color: #00a86b;
    color: #00ec91;
    background: #062016;
    padding: 0 8px;
  }

  .ant-tag {
    margin-inline-end: 0;
    border-radius: 3px;
    font-size: 12px;
    line-height: 20px;
  }

  @media (max-width: 1180px) {
    grid-template-columns: auto 1fr;
    height: auto;
    padding: 10px 14px;

    ${SourceNav},
    ${Clock},
    ${SearchBox},
    .actions {
      grid-column: 1 / -1;
    }
  }
`;

const TableWrap = styled.section`
  height: calc(100% - 42px);
  padding: 12px 26px 0;

  .ant-table-wrapper,
  .ant-spin-nested-loading,
  .ant-spin-container {
    height: 100%;
  }

  .ant-table {
    background: #061018 !important;
    color: #b9d8f0;
    border: 1px solid #162a39;
    border-radius: 2px;
  }

  .ant-table-container,
  .ant-table-content,
  .ant-table-header,
  .ant-table-body {
    background: #061018 !important;
  }

  .ant-table-thead > tr > th {
    height: 38px;
    background: #102232 !important;
    color: #9cc2e2 !important;
    border-color: #1a3144 !important;
    border-bottom: 1px solid #263f52 !important;
    font-weight: 600;
    font-size: 12px;
    padding: 0 8px !important;
  }

  .ant-table-column-sorters {
    padding: 0 !important;
  }

  .ant-table-column-title {
    color: #9cc2e2;
  }

  .ant-table-column-sorter {
    color: #486b84;
  }

  .ant-table-column-sorter-up.active,
  .ant-table-column-sorter-down.active {
    color: #4fb1ff;
  }

  .ant-table-thead th.ant-table-column-sort {
    background: #132a3d !important;
  }

  .ant-table-tbody td.ant-table-column-sort {
    background: #0a1924 !important;
  }

  .ant-table-tbody > tr > td {
    height: 34px;
    background: #07131c !important;
    color: #a9cee7;
    border-color: #1f3545 !important;
    border-bottom: 1px solid #314858 !important;
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    padding: 0 8px !important;
  }

  .ant-table-tbody > tr:hover > td,
  .ant-table-tbody > tr.ant-table-row:hover > td {
    background: #6f777b !important;
  }

  .ant-table-tbody > tr > td.ant-table-cell-fix-left,
  .ant-table-tbody > tr > td.ant-table-cell-fix-left-last,
  .ant-table-tbody > tr > td.ant-table-cell-fix-right,
  .ant-table-tbody > tr > td.ant-table-cell-fix-right-first {
    background: #07131c !important;
    color: #a9cee7 !important;
  }

  .ant-table-thead > tr > th.ant-table-cell-fix-left,
  .ant-table-thead > tr > th.ant-table-cell-fix-left-last,
  .ant-table-thead > tr > th.ant-table-cell-fix-right,
  .ant-table-thead > tr > th.ant-table-cell-fix-right-first {
    background: #102232 !important;
    color: #9cc2e2 !important;
  }

  .ant-table-cell-fix-left-last::after,
  .ant-table-cell-fix-right-first::after {
    box-shadow: inset 8px 0 8px -8px #132b3d !important;
  }

  .ant-pagination {
    margin: 10px 0 0;
    color: #9ec4e8;
  }

  .ant-pagination-total-text,
  .ant-pagination-item a,
  .ant-pagination-prev button,
  .ant-pagination-next button {
    color: #9ec4e8;
  }

  .ant-pagination-item,
  .ant-pagination-prev button,
  .ant-pagination-next button {
    background: #0d1a27;
    border-color: #29455d;
  }

  .ant-pagination-item-active {
    border-color: #4fa7ff;
  }

  .fund-code {
    color: #62b7ff;
    text-decoration: underline;
    font-weight: 700;
  }

  .fund-name,
  .strong {
    color: #f5fbff;
    font-weight: 700;
  }

  .estimate {
    color: #83c7ff;
    font-weight: 700;
  }

  .up {
    color: #ff4242;
    font-weight: 700;
  }

  .down {
    color: #00f17a;
    font-weight: 700;
  }

  .flat {
    color: #8aa2b8;
  }

  .favorite-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 3px;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .favorite-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .favorite {
    color: #33566f;
    font-size: 14px;
  }

  .favorite-button:hover .favorite,
  .favorite.active {
    color: #ffc84a;
  }

  .status {
    color: #d9f1ff;
    font-weight: 600;
  }
`;
