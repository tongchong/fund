"use client";

import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Dropdown, Form, Input, Layout, message, Modal, Typography } from "antd";
import CryptoJS from "crypto-js";
import { useRouter } from "next/navigation";
import { parseCookies } from "nookies";
import { useState } from "react";
import { trpc } from "src/server/trpc/api";
import { useUserStore } from "src/store/userStore";

const { Header: AntdHeader } = Layout;
const { Title } = Typography;
const ENCRYPT_KEY = "xiaosuan";

function validatePasswordComplexity(_: unknown, value: string) {
  if (!value) return Promise.resolve();
  if (value.length < 8 || value.length > 20) {
    return Promise.reject(new Error("密码长度需8-20位"));
  }
  if (!/[A-Z]/.test(value)) {
    return Promise.reject(new Error("密码需包含大写字母"));
  }
  if (!/[a-z]/.test(value)) {
    return Promise.reject(new Error("密码需包含小写字母"));
  }
  if (!/[0-9]/.test(value)) {
    return Promise.reject(new Error("密码需包含数字"));
  }
  if (/(.)\1\1/.test(value)) {
    return Promise.reject(new Error("密码不能有超过3个连续重复字符"));
  }
  return Promise.resolve();
}

export default function AppHeader() {
  const router = useRouter();
  const { username, clearUser } = useUserStore();
  const [isChangePwdModalVisible, setIsChangePwdModalVisible] = useState(false);

  const logoutMutation = trpc.user.logoutRouter.logout.useMutation();
  const changePasswordMutation = trpc.user.updateUserPassword.useMutation();

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    if (key === "changepassword") {
      setIsChangePwdModalVisible(true);
      return;
    }

    if (key === "logout") {
      const cookies = parseCookies();
      try {
        await logoutMutation.mutateAsync({ token: cookies.token || "" });
        message.success("退出成功");
      } catch (error) {
        console.error(error);
      } finally {
        localStorage.removeItem("token");
        clearUser();
        router.push("/login");
      }
    }
  };

  return (
    <AntdHeader
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <Title level={4} style={{ margin: 0, cursor: "pointer" }} onClick={() => router.push("/fund")}>
        LOF 基金实时监控
      </Title>

      <Dropdown
        menu={{
          onClick: handleUserMenuClick,
          items: [
            { key: "changepassword", icon: <SettingOutlined />, label: "修改密码" },
            { key: "logout", icon: <LogoutOutlined />, label: "退出" },
          ],
        }}
        trigger={["click"]}
      >
        <Button type="text" icon={<UserOutlined />}>
          {username || "用户"}
        </Button>
      </Dropdown>

      <Modal
        title="修改密码"
        open={isChangePwdModalVisible}
        onCancel={() => setIsChangePwdModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              const encryptedPassword = CryptoJS.AES.encrypt(values.newPassword, ENCRYPT_KEY).toString();
              await changePasswordMutation.mutateAsync({ newPassword: encryptedPassword });
              message.success("密码修改成功");
              setIsChangePwdModalVisible(false);
            } catch (error: any) {
              message.error(error?.message || "密码修改失败");
            }
          }}
        >
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { validator: validatePasswordComplexity },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setIsChangePwdModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </AntdHeader>
  );
}
