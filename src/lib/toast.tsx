import toast from 'react-hot-toast';
import { CustomToast } from '@/components/shared/CustomToast';

export const showSuccess = (message: string, description?: string) => {
    toast.custom((t) => (
        <CustomToast t={t} type="success" message={message} description={description} />
    ), {
        duration: 4000,
        position: 'top-center',
    });
};

export const showError = (message: string, description?: string) => {
    toast.custom((t) => (
        <CustomToast t={t} type="error" message={message} description={description} />
    ), {
        duration: 5000,
        position: 'top-center',
    });
};

export const showInfo = (message: string, description?: string) => {
    toast.custom((t) => (
        <CustomToast t={t} type="info" message={message} description={description} />
    ), {
        duration: 4000,
        position: 'top-center',
    });
};
