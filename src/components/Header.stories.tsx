import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./Header";

const meta = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    currentPath: {
      control: "select",
      options: ["/", "/tools/face-mosaic"],
    },
  },
  args: {
    currentPath: "/",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  args: {
    currentPath: "/",
  },
};

export const Tools: Story = {
  args: {
    currentPath: "/tools/face-mosaic",
  },
};
