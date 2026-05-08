"use client";

import { Card, Col, Row, Statistic, Table, Typography } from "antd";
import { trpc } from "src/server/trpc/api";
import { useUserStore } from "src/store/userStore";

const { Title, Text } = Typography;

export default function UserPage() {
  const { username, role } = useUserStore();
  const { data, isLoading } = trpc.user.list.useQuery({ page: 1, pageSize: 10 });

  return (
    <main style={{ padding: 24, overflow: "auto", height: "100%" }}>
      <Title level={3} style={{ marginTop: 0 }}>
        项目基础页
      </Title>
      <Text type="secondary">
        当前保留 Next + tRPC + MySQL + Ant Design + 基础认证能力，可在此基础上开始新业务开发。
      </Text>

      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="当前用户" value={username || "-"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="角色" value={role || "-"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="用户总数" value={data?.count ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card title="User 表">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data?.items ?? []}
          pagination={false}
          columns={[
            { title: "ID", dataIndex: "id", width: 80 },
            { title: "用户ID", dataIndex: "identity" },
            { title: "姓名", dataIndex: "name" },
            { title: "创建时间", dataIndex: "createTime" },
            { title: "更新时间", dataIndex: "updateTime" },
          ]}
        />
      </Card>
    </main>
  );
}
