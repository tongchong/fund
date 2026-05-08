// src/components/ImageCropModal.tsx
import { Modal } from "antd";
import React, { useCallback,useState } from "react";
import Cropper from "react-easy-crop";
interface Area { x: number; y: number; width: number; height: number }

interface ImageCropModalProps {
  open: boolean;
  image: string; // base64
  aspect?: number;
  onOk: (croppedUrl: string) => void;
  onCancel: () => void;
}

const _PREFIX = "tds";

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  image,
  aspect = 1,
  onOk,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleOk = async () => {
    if (!croppedAreaPixels) return;
    const croppedUrl = await getCroppedImg(image, croppedAreaPixels);
    onOk(croppedUrl);
  };

  return (
    <Modal
      title="请裁剪图片作为智能体封面"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确认裁剪"
      cancelText="取消"
      width={400}
      destroyOnClose
      style={{ paddingTop: 32, paddingBottom: 16 }}
    >
      <div style={{ position: "relative", width: "100%", height: 300 }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
    </Modal>
  );
};

export default ImageCropModal;

// 工具函数
function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "Anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height,
        );
        const match = /^data:image\/(\w+);base64,/.exec(imageSrc);
        const fileType = match ? match[1] : "png";
        resolve(canvas.toDataURL(`image/${fileType}`));
      }
    };
  });
}
