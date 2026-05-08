"use client";

import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { trpc } from "src/server/trpc/api";
import styled from "styled-components";

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
`;

const RegisterBox = styled.div`
  width: 350px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const RegisterTitle = styled.h2`
  text-align: center;
  color: #fff;
  font-weight: 600;
  margin-bottom: 30px;
`;

const StyledFormItem = styled(Form.Item)`
  .ant-input {
    border-radius: 5px;
    height: 40px;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    color: #fff;
    ::placeholder {
      color: #e0e0e0;
    }
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 40px;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.6);
  color: #333;
  font-weight: 600;
  border: none;
  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
    color: #000;
  }
`;

const Links = styled.div`
  margin-top: 20px;
  text-align: center;
  color: #fff;
  a {
    color: #fff;
    text-decoration: underline;
    &:hover {
      color: #e0e0e0;
    }
  }
`;

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = trpc.logon.register.useMutation(); // 使用trpc创建mutation

  const onFinish = async (values: any) => {
    try {
      const response = await registerMutation.mutateAsync({
        name: values.username,
        identity:values.username,
        password: values.password,
        departmentId: Number(values.department),
        phone: values.phone,
        email: values.email,
      });

      if (response.message) {
        message.success("注册成功！");
        router.push("/login");
      } else {
        message.error("注册失败，请稍后再试。");
      }
    } catch (error: any) {
      if (error.data?.code === "CONFLICT") {
        message.error("用户名已存在，请使用其他用户名。");
      } else {
        message.error("注册失败，请稍后再试。");
      }
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <RegisterContainer>
      <RegisterBox>
        <RegisterTitle>注册</RegisterTitle>
        <Form
          name="register"
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
            name="confirmPassword"
            dependencies={["password"]} // 确保依赖于 password 字段
            rules={[
              { required: true, message: "请确认密码!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="确认密码" />
          </StyledFormItem>

          <StyledFormItem
            name="phone"
            rules={[{ required: true, message: "请输入手机号!" }]}
          >
            <Input placeholder="手机号" />
          </StyledFormItem>

          <StyledFormItem
            name="email"
            rules={[
              { required: true, message: "请输入邮箱!" },
              {
                type: "email", // 使用内置的邮箱验证规则
                message: "请输入有效的邮箱地址!",
              },
            ]}
          >
            <Input placeholder="邮箱" />
          </StyledFormItem>

          <StyledFormItem>
            <StyledButton type="primary" htmlType="submit">
              注册
            </StyledButton>
          </StyledFormItem>

          <Links>
            <a onClick={handleLoginClick}>已经有账号？ 登录</a>
          </Links>
        </Form>
      </RegisterBox>
    </RegisterContainer>
  );
}
