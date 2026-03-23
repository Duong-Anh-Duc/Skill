import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Descriptions,
  Alert,
  Row,
  Col,
  Tooltip,
  Badge,
  Flex,
} from 'antd';
import {
  GoogleOutlined,
  KeyOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  MailOutlined,
  FolderOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  InboxOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  ApiOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  TableOutlined,
  FileTextOutlined,
  ContactsOutlined,
  CheckSquareOutlined,
  YoutubeOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { List, Modal } from 'antd';
import { oauthApi } from '@/api';
import { useAppStore } from '@/stores';
import { showSuccess, showError } from '@/utils';
import type { TokenInfo, TokenData, GmailInfo, DriveFile, CalendarEvent } from '@/types';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

interface EmailDetail {
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}

const { Title, Text, Paragraph } = Typography;

export default function OAuthPage() {
  const { userId, setUserId, darkMode, toggleDarkMode } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [apiResult, setApiResult] = useState<Record<string, unknown> | null>(null);
  const [apiError, setApiError] = useState('');
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const isDark = darkMode;

  // Check callback params on mount
  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');
    const cbUserId = searchParams.get('userId');

    if (status === 'connected' && cbUserId) {
      setUserId(cbUserId);
      setConnected(true);
      showSuccess(`Kết nối Google thành công cho ${cbUserId}!`);
      setSearchParams({}, { replace: true });
    } else if (error) {
      showError(`Lỗi OAuth: ${decodeURIComponent(error)}`);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleConnect = () => {
    if (!userId.trim()) return showError('Vui lòng nhập userId');
    window.location.href = oauthApi.getConnectUrl(userId);
  };

  const handleGetToken = async () => {
    if (!userId.trim()) return showError('Vui lòng nhập userId');
    setLoading('token');
    try {
      const { data } = await oauthApi.getToken(userId);
      if (data.success && data.data) {
        setTokenData(data.data);
        setConnected(true);
        showSuccess(data.data.refreshed ? 'Token đã được refresh!' : 'Lấy token thành công!');
      }
    } catch (err: any) {
      setConnected(false);
      setTokenData(null);
      showError(err.response?.data?.message || 'Không tìm thấy token');
    } finally {
      setLoading('');
    }
  };

  const handleGetInfo = async () => {
    if (!userId.trim()) return showError('Vui lòng nhập userId');
    setLoading('info');
    try {
      const { data } = await oauthApi.getTokenInfo(userId);
      if (data.success && data.data) {
        setTokenInfo(data.data);
        setConnected(true);
      }
    } catch (err: any) {
      setConnected(false);
      setTokenInfo(null);
      showError(err.response?.data?.message || 'Không tìm thấy token');
    } finally {
      setLoading('');
    }
  };

  const handleRevoke = async () => {
    if (!userId.trim()) return showError('Vui lòng nhập userId');
    setLoading('revoke');
    try {
      const { data } = await oauthApi.revokeToken(userId);
      if (data.success) {
        setConnected(false);
        setTokenData(null);
        setTokenInfo(null);
        setApiResult(null);
        showSuccess('Đã revoke và xoá token!');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Lỗi revoke token');
    } finally {
      setLoading('');
    }
  };

  const fetchGoogleApi = async (url: string, label: string) => {
    setLoading(label);
    setApiResult(null);
    setApiError('');
    try {
      const { data: tokenRes } = await oauthApi.getToken(userId);
      if (!tokenRes.success || !tokenRes.data) throw new Error('Không lấy được token');

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json;
    } catch (err: any) {
      setApiError(err.message);
      showError(`${label} Error: ${err.message}`);
      return null;
    } finally {
      setLoading('');
    }
  };

  const getHeader = (headers: any[], name: string) =>
    headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const base64Decode = (data: string): string => {
    const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  };

  const decodeBody = (payload: any): string => {
    const findPart = (parts: any[]): string | null => {
      for (const p of parts) {
        if (p.mimeType === 'text/html' && p.body?.data) {
          return base64Decode(p.body.data);
        }
      }
      for (const p of parts) {
        if (p.mimeType === 'text/plain' && p.body?.data) {
          const text = base64Decode(p.body.data);
          return `<pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>`;
        }
      }
      for (const p of parts) {
        if (p.parts) {
          const result = findPart(p.parts);
          if (result) return result;
        }
      }
      return null;
    };

    if (payload?.body?.data) {
      return base64Decode(payload.body.data);
    }
    if (payload?.parts) {
      return findPart(payload.parts) || '(Không đọc được nội dung email)';
    }
    return '(Không đọc được nội dung email)';
  };

  const handleListEmails = async () => {
    setLoading('emailList');
    setEmails([]);
    setApiResult(null);
    setApiError('');
    try {
      const { data: tokenRes } = await oauthApi.getToken(userId);
      if (!tokenRes.success || !tokenRes.data) throw new Error('Không lấy được token');
      const token = tokenRes.data.access_token;

      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const listData = await listRes.json();
      if (listData.error) throw new Error(listData.error.message);

      const fetches = (listData.messages || []).map((msg: any) =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } },
        ).then((r) => r.json()),
      );
      const results = await Promise.all(fetches);

      const items: EmailItem[] = results.map((msgData: any) => ({
        id: msgData.id,
        subject: getHeader(msgData.payload?.headers, 'Subject') || '(Không có tiêu đề)',
        from: getHeader(msgData.payload?.headers, 'From'),
        date: getHeader(msgData.payload?.headers, 'Date'),
        snippet: msgData.snippet || '',
      }));

      setEmails(items);
    } catch (err: any) {
      setApiError(err.message);
      showError(`Gmail Error: ${err.message}`);
    } finally {
      setLoading('');
    }
  };

  const handleViewEmail = async (emailId: string) => {
    setLoading(`email-${emailId}`);
    try {
      const { data: tokenRes } = await oauthApi.getToken(userId);
      if (!tokenRes.success || !tokenRes.data) throw new Error('Không lấy được token');

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
        { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } },
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setEmailDetail({
        subject: getHeader(data.payload?.headers, 'Subject') || '(Không có tiêu đề)',
        from: getHeader(data.payload?.headers, 'From'),
        to: getHeader(data.payload?.headers, 'To'),
        date: getHeader(data.payload?.headers, 'Date'),
        body: decodeBody(data.payload),
      });
      setEmailModalOpen(true);
    } catch (err: any) {
      showError(`Lỗi đọc email: ${err.message}`);
    } finally {
      setLoading('');
    }
  };

  const handleTestGmail = async () => {
    const labelsData = await fetchGoogleApi(
      'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      'Gmail',
    );
    if (!labelsData) return;

    const { data: tokenRes } = await oauthApi.getToken(userId);
    const inboxRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX',
      { headers: { Authorization: `Bearer ${tokenRes.data!.access_token}` } },
    );
    const inbox = await inboxRes.json();

    const result: GmailInfo = {
      total_labels: labelsData.labels?.length || 0,
      inbox_total: inbox.messagesTotal || 0,
      inbox_unread: inbox.messagesUnread || 0,
    };
    setApiResult({ service: 'Gmail', ...result });
  };

  const handleTestDrive = async () => {
    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name,mimeType,modifiedTime)',
      'Drive',
    );
    if (!data) return;

    const files: DriveFile[] = data.files?.map((f: any) => ({ name: f.name, type: f.mimeType })) || [];
    setApiResult({ service: 'Google Drive', recent_files: files });
  };

  const handleTestCalendar = async () => {
    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const data = await fetchGoogleApi(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${nextWeek}&maxResults=5&singleEvents=true&orderBy=startTime`,
      'Calendar',
    );
    if (!data) return;

    const events: CalendarEvent[] = data.items?.map((e: any) => ({
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
    })) || [];
    setApiResult({ service: 'Google Calendar', upcoming_events: events });
  };

  const handleTestSheets = async () => {
    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.spreadsheet%27&pageSize=10&fields=files(id,name,modifiedTime,owners)',
      'Sheets',
    );
    if (!data) return;
    const files = data.files?.map((f: any) => ({
      name: f.name,
      id: f.id,
      modified: f.modifiedTime,
      owner: f.owners?.[0]?.displayName || '',
    })) || [];
    setApiResult({ service: 'Google Sheets', total: files.length, spreadsheets: files });
  };

  const handleTestDocs = async () => {
    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.document%27&pageSize=10&fields=files(id,name,modifiedTime,owners)',
      'Docs',
    );
    if (!data) return;
    const files = data.files?.map((f: any) => ({
      name: f.name,
      id: f.id,
      modified: f.modifiedTime,
      owner: f.owners?.[0]?.displayName || '',
    })) || [];
    setApiResult({ service: 'Google Docs', total: files.length, documents: files });
  };

  const handleTestContacts = async () => {
    const data = await fetchGoogleApi(
      'https://people.googleapis.com/v1/people/me/connections?pageSize=10&personFields=names,emailAddresses,phoneNumbers',
      'Contacts',
    );
    if (!data) return;
    const contacts = data.connections?.map((c: any) => ({
      name: c.names?.[0]?.displayName || '(Không tên)',
      email: c.emailAddresses?.[0]?.value || '',
      phone: c.phoneNumbers?.[0]?.value || '',
    })) || [];
    setApiResult({ service: 'Google Contacts', total: data.totalPeople || contacts.length, contacts });
  };

  const handleTestTasks = async () => {
    const taskListsData = await fetchGoogleApi(
      'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
      'Tasks',
    );
    if (!taskListsData) return;

    const lists = taskListsData.items || [];
    const allTasks: any[] = [];
    for (const list of lists.slice(0, 3)) {
      const tasksData = await fetchGoogleApi(
        `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?maxResults=5`,
        'Tasks',
      );
      if (tasksData?.items) {
        allTasks.push(...tasksData.items.map((t: any) => ({
          title: t.title,
          status: t.status,
          due: t.due || null,
          list: list.title,
        })));
      }
    }
    setApiResult({ service: 'Google Tasks', task_lists: lists.length, tasks: allTasks });
  };

  const handleTestYouTube = async () => {
    const data = await fetchGoogleApi(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      'YouTube',
    );
    if (!data) return;
    const channel = data.items?.[0];
    if (channel) {
      setApiResult({
        service: 'YouTube',
        channel_name: channel.snippet?.title,
        description: channel.snippet?.description,
        subscribers: channel.statistics?.subscriberCount,
        total_videos: channel.statistics?.videoCount,
        total_views: channel.statistics?.viewCount,
      });
    } else {
      setApiResult({ service: 'YouTube', message: 'Không tìm thấy kênh YouTube' });
    }
  };

  const handleTestSlides = async () => {
    const data = await fetchGoogleApi(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.presentation%27&pageSize=10&fields=files(id,name,modifiedTime,owners)',
      'Slides',
    );
    if (!data) return;
    const files = data.files?.map((f: any) => ({
      name: f.name,
      id: f.id,
      modified: f.modifiedTime,
      owner: f.owners?.[0]?.displayName || '',
    })) || [];
    setApiResult({ service: 'Google Slides', total: files.length, presentations: files });
  };

  // ── Style helpers ──
  const glass = (bg: string, border: string) => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 16,
    backdropFilter: 'blur(12px)',
  });

  const cardStyle = isDark
    ? glass('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)')
    : glass('rgba(255,255,255,0.7)', 'rgba(0,0,0,0.06)');

  const sectionIcon = (icon: React.ReactNode, color: string) => (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      background: `${color}15`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      color,
      flexShrink: 0,
    }}>
      {icon}
    </div>
  );

  const apiButtonStyle = (color: string) => ({
    borderRadius: 12,
    height: 44,
    fontWeight: 500 as const,
    border: `1.5px solid ${color}30`,
    color,
    background: `${color}08`,
    boxShadow: `0 2px 8px ${color}10`,
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)'
        : 'linear-gradient(135deg, #667eea15 0%, #764ba215 50%, #f093fb10 100%)',
    }}>
      {/* ── Header ── */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 50%, #1a1a3e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px 16px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Flex justify="space-between" align="start">
            <div>
              <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}>
                  <GoogleOutlined style={{ color: '#fff' }} />
                </div>
                <div>
                  <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                    Google OAuth2 Service
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    Kết nối và quản lý Google OAuth tokens
                  </Text>
                </div>
              </Flex>
            </div>

            <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
              <Button
                shape="circle"
                size="large"
                icon={isDark ? <BulbFilled /> : <BulbOutlined />}
                onClick={toggleDarkMode}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </Tooltip>
          </Flex>

          {/* Status badges */}
          <Flex gap={8} style={{ marginTop: 20 }}>
            <Tag style={{
              borderRadius: 20,
              padding: '2px 12px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              backdropFilter: 'blur(10px)',
            }}>
              <ApiOutlined style={{ marginRight: 4 }} /> OAuth 2.0
            </Tag>
            {connected === true && (
              <Tag style={{
                borderRadius: 20,
                padding: '2px 12px',
                background: 'rgba(52,168,83,0.3)',
                border: 'none',
                color: '#7dffaa',
              }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} /> Connected
              </Tag>
            )}
            {connected === false && (
              <Tag style={{
                borderRadius: 20,
                padding: '2px 12px',
                background: 'rgba(234,67,53,0.3)',
                border: 'none',
                color: '#ff8a80',
              }}>
                <CloseCircleOutlined style={{ marginRight: 4 }} /> Not Connected
              </Tag>
            )}
          </Flex>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{
        maxWidth: 860,
        margin: '-24px auto 0',
        padding: '0 16px 48px',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* ── Section 1: User ID ── */}
        <Card
          style={{ ...cardStyle, marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          styles={{
            body: { padding: '24px' },
            header: { border: 'none', padding: '20px 24px 0' },
          }}
          title={
            <Flex align="center" gap={12}>
              {sectionIcon(<UserOutlined />, '#667eea')}
              <div>
                <Text strong style={{ fontSize: 15 }}>User Identity</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Nhập userId để bắt đầu kết nối</Text>
              </div>
            </Flex>
          }
        >
          <Input
            size="large"
            prefix={<UserOutlined style={{ color: '#bbb' }} />}
            placeholder="Nhập userId (vd: user_123)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              borderRadius: 12,
              height: 48,
              fontSize: 15,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f8f9ff',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e8e8ff',
            }}
          />
        </Card>

        {/* ── Section 2: OAuth Actions ── */}
        <Card
          style={{ ...cardStyle, marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          styles={{
            body: { padding: '24px' },
            header: { border: 'none', padding: '20px 24px 0' },
          }}
          title={
            <Flex align="center" gap={12}>
              {sectionIcon(<LinkOutlined />, '#764ba2')}
              <div>
                <Text strong style={{ fontSize: 15 }}>Kết nối Google</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Quản lý OAuth tokens</Text>
              </div>
            </Flex>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                type="primary"
                icon={<GoogleOutlined />}
                onClick={handleConnect}
                block
                style={{
                  height: 44,
                  borderRadius: 12,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4285f4, #667eea)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(66,133,244,0.35)',
                }}
              >
                Connect
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                icon={<KeyOutlined />}
                onClick={handleGetToken}
                loading={loading === 'token'}
                block
                style={{
                  height: 44,
                  borderRadius: 12,
                  fontWeight: 500,
                  color: '#34a853',
                  borderColor: '#34a85340',
                  background: isDark ? 'rgba(52,168,83,0.08)' : '#f0faf3',
                }}
              >
                Get Token
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                icon={<InfoCircleOutlined />}
                onClick={handleGetInfo}
                loading={loading === 'info'}
                block
                style={{
                  height: 44,
                  borderRadius: 12,
                  fontWeight: 500,
                  color: '#667eea',
                  borderColor: '#667eea40',
                  background: isDark ? 'rgba(102,126,234,0.08)' : '#f0f2ff',
                }}
              >
                Token Info
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleRevoke}
                loading={loading === 'revoke'}
                block
                style={{
                  height: 44,
                  borderRadius: 12,
                  fontWeight: 500,
                }}
              >
                Revoke
              </Button>
            </Col>
          </Row>

          {tokenData && (
            <div style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 12,
              background: isDark ? 'rgba(52,168,83,0.06)' : '#f6fff8',
              border: isDark ? '1px solid rgba(52,168,83,0.15)' : '1px solid #d4edda',
            }}>
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <ThunderboltOutlined style={{ color: '#34a853' }} />
                <Text strong style={{ color: '#34a853' }}>Access Token</Text>
                <Tag
                  color={tokenData.refreshed ? 'orange' : 'green'}
                  style={{ borderRadius: 10, marginLeft: 'auto' }}
                >
                  {tokenData.refreshed ? 'Auto-refreshed' : 'Valid'}
                </Tag>
              </Flex>
              <Paragraph
                copyable
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  wordBreak: 'break-all',
                  margin: 0,
                  padding: 12,
                  borderRadius: 8,
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #eee',
                }}
              >
                {tokenData.access_token}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                Hết hạn: {new Date(tokenData.expiry).toLocaleString('vi-VN')}
              </Text>
            </div>
          )}

          {tokenInfo && (
            <div style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 12,
              background: isDark ? 'rgba(102,126,234,0.06)' : '#f0f2ff',
              border: isDark ? '1px solid rgba(102,126,234,0.15)' : '1px solid #d0d5ff',
            }}>
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <InfoCircleOutlined style={{ color: '#667eea' }} />
                <Text strong style={{ color: '#667eea' }}>Token Information</Text>
              </Flex>
              <Descriptions
                bordered
                size="small"
                column={1}
                style={{ borderRadius: 8, overflow: 'hidden' }}
              >
                <Descriptions.Item label="User ID">
                  <Tag color="blue" style={{ borderRadius: 8 }}>{tokenInfo.user_id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Token Preview">
                  <Text code style={{ fontSize: 12 }}>{tokenInfo.token_preview}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Expiry">
                  {new Date(tokenInfo.expiry).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {new Date(tokenInfo.created_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Updated">
                  {new Date(tokenInfo.updated_at).toLocaleString('vi-VN')}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Card>

        {/* ── Section 3: Test Google APIs ── */}
        <Card
          style={{ ...cardStyle, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          styles={{
            body: { padding: '24px' },
            header: { border: 'none', padding: '20px 24px 0' },
          }}
          title={
            <Flex align="center" gap={12}>
              {sectionIcon(<ApiOutlined />, '#ea4335')}
              <div>
                <Text strong style={{ fontSize: 15 }}>Test Google APIs</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Kiểm tra kết nối với các dịch vụ Google</Text>
              </div>
            </Flex>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <Button
                icon={<MailOutlined />}
                onClick={handleTestGmail}
                loading={loading === 'Gmail'}
                block
                style={apiButtonStyle('#ea4335')}
              >
                Gmail Stats
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<InboxOutlined />}
                onClick={handleListEmails}
                loading={loading === 'emailList'}
                block
                style={apiButtonStyle('#ea4335')}
              >
                Xem Email
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<FolderOutlined />}
                onClick={handleTestDrive}
                loading={loading === 'Drive'}
                block
                style={apiButtonStyle('#34a853')}
              >
                Drive API
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<CalendarOutlined />}
                onClick={handleTestCalendar}
                loading={loading === 'Calendar'}
                block
                style={apiButtonStyle('#fbbc04')}
              >
                Calendar
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<TableOutlined />}
                onClick={handleTestSheets}
                loading={loading === 'Sheets'}
                block
                style={apiButtonStyle('#0f9d58')}
              >
                Sheets
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<FileTextOutlined />}
                onClick={handleTestDocs}
                loading={loading === 'Docs'}
                block
                style={apiButtonStyle('#4285f4')}
              >
                Docs
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<ContactsOutlined />}
                onClick={handleTestContacts}
                loading={loading === 'Contacts'}
                block
                style={apiButtonStyle('#7b1fa2')}
              >
                Contacts
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<CheckSquareOutlined />}
                onClick={handleTestTasks}
                loading={loading === 'Tasks'}
                block
                style={apiButtonStyle('#ff6d00')}
              >
                Tasks
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<YoutubeOutlined />}
                onClick={handleTestYouTube}
                loading={loading === 'YouTube'}
                block
                style={apiButtonStyle('#ff0000')}
              >
                YouTube
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                icon={<SlidersOutlined />}
                onClick={handleTestSlides}
                loading={loading === 'Slides'}
                block
                style={apiButtonStyle('#f4b400')}
              >
                Slides
              </Button>
            </Col>
          </Row>

          {apiError && (
            <Alert
              type="error"
              description={apiError}
              showIcon
              closable
              style={{ marginTop: 20, borderRadius: 12 }}
              afterClose={() => setApiError('')}
            />
          )}

          {apiResult && (
            <div style={{
              marginTop: 20,
              borderRadius: 12,
              overflow: 'hidden',
              border: isDark ? '1px solid rgba(52,168,83,0.2)' : '1px solid #d4edda',
            }}>
              <div style={{
                padding: '10px 16px',
                background: isDark ? 'rgba(52,168,83,0.1)' : '#f0fff4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#34a853' }} />
                  <Text strong style={{ fontSize: 13 }}>API Response</Text>
                </Space>
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => setApiResult(null)}
                >
                  Clear
                </Button>
              </div>
              <pre style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : '#fafffe',
                padding: 16,
                fontSize: 12,
                overflow: 'auto',
                maxHeight: 300,
                margin: 0,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
              }}>
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* ── Email List ── */}
        {emails.length > 0 && (
          <Card
            style={{ ...cardStyle, marginTop: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
            styles={{
              body: { padding: '16px 24px 24px' },
              header: { border: 'none', padding: '20px 24px 0' },
            }}
            title={
              <Flex align="center" gap={12}>
                {sectionIcon(<InboxOutlined />, '#ea4335')}
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    Danh sách Email
                  </Text>
                  <Badge
                    count={emails.length}
                    style={{ marginLeft: 8, backgroundColor: '#667eea' }}
                  />
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Gmail Inbox</Text>
                </div>
              </Flex>
            }
            extra={
              <Button
                size="small"
                type="text"
                onClick={() => setEmails([])}
                style={{ borderRadius: 8 }}
              >
                Clear
              </Button>
            }
          >
            <List
              dataSource={emails}
              pagination={{
                pageSize: 10,
                size: 'small',
                showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} email`,
              }}
              renderItem={(item, index) => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderRadius: 12,
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f0f0f0',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                    transition: 'all 0.2s',
                  }}
                  actions={[
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<EyeOutlined />}
                      loading={loading === `email-${item.id}`}
                      onClick={() => handleViewEmail(item.id)}
                      style={{ borderRadius: 8 }}
                    >
                      Xem
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isDark ? 'rgba(102,126,234,0.15)' : '#eef0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#667eea',
                      }}>
                        {index + 1}
                      </div>
                    }
                    title={
                      <Text strong style={{ fontSize: 13, lineHeight: 1.4 }}>
                        {item.subject}
                      </Text>
                    }
                    description={
                      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                        <Text type="secondary">{item.from}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.date}</Text>
                        <Paragraph
                          type="secondary"
                          ellipsis={{ rows: 1 }}
                          style={{ fontSize: 12, margin: '4px 0 0', color: isDark ? '#888' : '#999' }}
                        >
                          {item.snippet}
                        </Paragraph>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      {/* ── Email Detail Modal ── */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <MailOutlined style={{ color: '#667eea', fontSize: 18 }} />
            <Text strong style={{ fontSize: 15 }}>
              {emailDetail?.subject || 'Chi tiết Email'}
            </Text>
          </Flex>
        }
        open={emailModalOpen}
        onCancel={() => setEmailModalOpen(false)}
        footer={null}
        width={800}
        styles={{
          body: { padding: '20px 24px' },
          header: { padding: '16px 24px' },
        }}
      >
        {emailDetail && (
          <div>
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: isDark ? 'rgba(255,255,255,0.04)' : '#f8f9ff',
              marginBottom: 16,
            }}>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Từ</Text>
                  <br />
                  <Text strong style={{ fontSize: 13 }}>{emailDetail.from}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Đến</Text>
                  <br />
                  <Text style={{ fontSize: 13 }}>{emailDetail.to}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Ngày</Text>
                  <br />
                  <Text style={{ fontSize: 13 }}>{emailDetail.date}</Text>
                </Col>
              </Row>
            </div>
            <div style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee',
            }}>
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="UTF-8"/>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
                    <style>
                      body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 13px;
                        line-height: 1.6;
                        color: ${isDark ? '#ddd' : '#333'};
                        background: ${isDark ? '#1a1a2e' : '#fff'};
                        margin: 0;
                        padding: 16px;
                        word-break: break-word;
                      }
                      img { max-width: 100%; height: auto; }
                      a { color: #667eea; }
                      table { max-width: 100%; }
                      pre { white-space: pre-wrap; }
                    </style>
                  </head>
                  <body>${emailDetail.body}</body>
                  </html>
                `}
                style={{
                  width: '100%',
                  minHeight: 350,
                  border: 'none',
                  borderRadius: 12,
                }}
                sandbox="allow-same-origin"
                title="Email content"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
