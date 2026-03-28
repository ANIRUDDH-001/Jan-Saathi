import dynamic from 'next/dynamic';

const Chat = dynamic(
  () => import('@/components/pages/Chat').then((mod) => ({ default: mod.Chat }))
);

export default function ChatPage() {
  return <Chat />;
}