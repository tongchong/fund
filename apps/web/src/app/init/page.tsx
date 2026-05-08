"use client";

import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GarlicLogo from "src/icons/tinyGarlicIcon";
import { trpc } from "src/server/trpc/api";
import styled from "styled-components";

const InitContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh);
`;

const InitBox = styled.div`
  width: 380px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const InitTitle = styled.h2`
  font-weight: bold;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
`;

const StyledFormItem = styled(Form.Item)`
  .ant-input,
  .ant-input-password {
    border-radius: 8px;
    height: 42px;
    max-height: 100%;
    font-size: 16px;
    transition: all 0.3s ease-in-out;
    &:hover {
      border-color: #d32f2f;
    }
  }

  .ant-input-suffix {
    font-size: 16px;
  }

  .ant-input-password {
    border: 1px solid #ccc;
  }
`;

const StyledButton = styled(Button)`
  &&& {
    width: 100%;
    height: 42px;
    font-size: 16px;
  }
`;

export default function InitPage() {
  const router = useRouter();

  const initMutation = trpc.logon.init.useMutation();
  const checkAdminExists = trpc.user.checkAdminExists.useQuery();

  useEffect(() => {
    if (checkAdminExists.data?.exists == true) {
      message.error("系统已初始化过，请直接登录");
      router.push("/login");
    }
  }, [checkAdminExists.data, router]);

  useEffect(() => {
    const layout = document.querySelector<HTMLElement>(".ant-layout");
    const footer = document.querySelector("footer");

    if (layout) {
      layout.style.backgroundImage = "url('/登录.png')";
      layout.style.backgroundSize = "cover";
      layout.style.backgroundRepeat = "no-repeat";
      layout.style.backgroundPosition = "center";
    }

    if (footer) {
      footer.style.backgroundColor = "transparent";
    }

    return () => {
      if (layout) {
        layout.style.backgroundImage = "";
        layout.style.backgroundSize = "";
        layout.style.backgroundRepeat = "";
        layout.style.backgroundPosition = "";
      }

      if (footer) {
        footer.style.backgroundColor = "";
      }
    };
  }, []);

  const onFinish = async (values: any) => {
    try {
      const response = await initMutation.mutateAsync({
        name: values.username,
        identity: values.username,
        password: values.password,
        departmentId: Number(values.department),
        email: values.email,
        phone: values.phone,
        role: "ADMIN",
      });

      if (response.message) {
        message.success("初始化成功！");
        router.push("/login");
      } else {
        message.error("初始化失败，请稍后再试。");
      }
    } catch (error: any) {
      message.error(error.message || "初始化失败，请稍后再试。");
    }
  };

  const onFinishFailed = () => {
    // validation errors are shown inline by antd Form
  };

  return (
    <InitContainer>
      <div
        style={{
          position: "absolute",
          top: "27px",
          left: "43px",
        }}
      >
        <GarlicLogo />
      </div>
      <InitBox>
        <InitTitle>系统初始化</InitTitle>
        <Form
          name="init"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <StyledFormItem
            name="username"
            rules={[{ required: true, message: "请输入用户名!" }]}
          >
            <Input placeholder="用户名" />
          </StyledFormItem>

          <StyledFormItem
            name="password"
            rules={[{ required: true, message: "请输入密码!" }]}
          >
            <Input.Password placeholder="密码" />
          </StyledFormItem>

          <StyledFormItem
            name="email"
            rules={[{ required: true, message: "请输入邮箱!" }]}
          >
            <Input placeholder="邮箱" />
          </StyledFormItem>

          <StyledFormItem
            name="phone"
            rules={[{ required: true, message: "请输入手机号!" }]}
          >
            <Input placeholder="手机号码" />
          </StyledFormItem>

          <StyledFormItem>
            <StyledButton type="primary" htmlType="submit">
              初始化
            </StyledButton>
          </StyledFormItem>
        </Form>
      </InitBox>
    </InitContainer>
  );
}
