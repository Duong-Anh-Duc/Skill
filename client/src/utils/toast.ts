import { toast } from 'react-toastify';

export const showSuccess = (msg: string) => toast.success(msg, { autoClose: 3000 });
export const showError = (msg: string) => toast.error(msg, { autoClose: 4000 });
export const showWarning = (msg: string) => toast.warning(msg, { autoClose: 3000 });
