import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppStore } from '@/stores';
import OAuthPage from '@/pages/OAuthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { darkMode } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#667eea',
            borderRadius: 12,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<OAuthPage />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
