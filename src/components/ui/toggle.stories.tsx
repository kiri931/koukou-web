import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    size: "default",
    disabled: false,
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Toggle bold",
    children: <Bold />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    "aria-label": "Toggle italic",
    children: <Italic />,
  },
};

export const WithText: Story = {
  args: {
    "aria-label": "Toggle underline",
    children: (
      <>
        <Underline />
        Underline
      </>
    ),
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    "aria-label": "Toggle bold",
    children: <Bold />,
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    "aria-label": "Toggle bold",
    children: <Bold />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    "aria-label": "Toggle bold",
    children: <Bold />,
  },
};
