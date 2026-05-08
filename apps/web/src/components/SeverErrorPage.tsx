"use client";

import { Result } from "antd";
import React from "react";

import { Head } from "../components/head";


export const ServerErrorPage: React.FC = () => {
  return (
    <>
      <Head title="Server Error" />
      <Result
        status="500"
        title="500"
        subTitle="Server Error Page"
      />
    </>
  );
};
