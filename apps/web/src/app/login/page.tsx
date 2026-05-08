"use client";

import { Button, Checkbox, Form, Input, message } from "antd";
import CryptoJS from "crypto-js";
import { useRouter } from "next/navigation";
import { setCookie } from "nookies";
import { useEffect } from "react";
import GarlicLogo from "src/icons/tinyGarlicIcon";
import { trpc } from "src/server/trpc/api";
import { useUserStore } from "src/store/userStore"; // 导入 zustand store
import styled from "styled-components";

const ENCRYPT_KEY = "xiaosuan";

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh);
`;

const LoginBox = styled.div`
  width: 380px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const LoginTitle = styled.h2`
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

  .ant-checkbox-wrapper {
    color: #333;
  }

  .ant-form-item-control-input-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const StyledButton = styled(Button)`
  &&& {
    width: 100%;
    height: 42px;
    font-size: 16px;
  }
`;

const Links = styled.div`
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  color: #666;
  a {
    color: #d32f2f;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;


export default function LoginPage() {
  const router = useRouter();
  const loginMutation = trpc.login.authRouter.login.useMutation();
  const setUser = useUserStore((state) => state.setUser); // 获取 setUser 方法
  const setEnvVariables = useUserStore((state) => state.setEnvVariables);
  const rememberedUsername = typeof window !== "undefined" ? localStorage.getItem("rememberedUsername") || "" : "";

  // 获取环境变量
  const envQuery = trpc.login.envRouter.getEnvVariables.useQuery(undefined, {
    enabled: false, // 默认禁用查询
  });

  // 修改背景图片
  useEffect(() => {
    const layout = document.querySelector<HTMLElement>(".ant-layout");
    const footer = document.querySelector("footer");

    if (layout) {
      layout.style.backgroundImage = "url('/登录.png')";
      layout.style.backgroundSize = "cover"; // 拉伸背景图片以覆盖整个区域
      layout.style.backgroundRepeat = "no-repeat"; // 禁止重复
      layout.style.backgroundPosition = "center"; // 居中显示背景图片
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
    const encrypted = CryptoJS.AES.encrypt(values.password, ENCRYPT_KEY).toString();

    try {
      const response = await loginMutation.mutateAsync({
        identity: values.username,
        password: encrypted,
      });

      if (response.token) {
        // 记住我逻辑
        if (values.remember) {
          localStorage.setItem("rememberedUsername", values.username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        // 设置 cookie
        setCookie(null, "token", response.token, {
          maxAge: 60 * 600,
          path: "/",
        });

        // 更新用户状态
        setUser(response.id, response.username, response.role);

        void envQuery.refetch().then((envResponse) => {
          if (envResponse.data) {
            setEnvVariables(envResponse.data);
          }
        });
        redirectUser(response.role);
      }
    } catch (error: any) {
      if (error.data?.code === "NOT_FOUND") {
        message.error("用户未找到，请检查用户名或密码。");
      } else if (error.data?.code === "UNAUTHORIZED") {
        message.error("密码错误，请重试。");
      } else {
        message.error(error.message);
      }
    }
  };


  const redirectUser = (role: string) => {
    if (role === "ADMIN") {
      router.push("/user");
    } else {
      router.push("/user");
    }
  };

  const handleRegisterClick = () => {
    router.push("/logon");
  };

  return (
    <LoginContainer>
      <div
        style={{
          position: "absolute",
          top: "27px",
          left: "43px",
        }}
      >
        <GarlicLogo />
      </div>
      <LoginBox>
        <LoginTitle>欢迎登录小蒜</LoginTitle>
        <Form
          name="basic"
          initialValues={{
            remember: !!rememberedUsername,
            username: rememberedUsername,
          }}
          onFinish={(values) => void onFinish(values)}
        >
          <StyledFormItem
            name="username"
            rules={[{ required: true, message: "请输入用户ID!" }]}
          >
            <Input placeholder="用户ID" />
          </StyledFormItem>

          <StyledFormItem
            name="password"
            rules={[{ required: true, message: "请输入密码!" }]}
          >
            <Input.Password placeholder="密码" />
          </StyledFormItem>

          <StyledFormItem>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            {/* <a href="">忘记密码?</a> */}
          </StyledFormItem>

          <StyledFormItem>
            <StyledButton type="primary" htmlType="submit">
              登录
            </StyledButton>
          </StyledFormItem>

          { process.env.NEXT_PUBLIC_ALLOW_LOGON === "1" && (
            <Links>
              <a onClick={handleRegisterClick}>没有账号? 注册</a>
            </Links>
          )}
        </Form>
      </LoginBox>
    </LoginContainer>
  );
}
