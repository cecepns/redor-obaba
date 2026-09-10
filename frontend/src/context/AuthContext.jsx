import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('redor_obaba_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(API_ENDPOINTS.AUTH.PROFILE);
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      localStorage.removeItem('redor_obaba_token');
      localStorage.removeItem('redor_obaba_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { identifier, password });
      if (res.data?.success) {
        localStorage.setItem('redor_obaba_token', res.data.token);
        localStorage.setItem('redor_obaba_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success(res.data.message || 'Login berhasil!');
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login gagal. Periksa nomor WA/password.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, formData);
      if (res.data?.success) {
        if (res.data.token && res.data.user?.is_verified) {
          localStorage.setItem('redor_obaba_token', res.data.token);
          localStorage.setItem('redor_obaba_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
        toast.success(res.data.message || 'Pendaftaran berhasil diajukan!');
        return { success: true, message: res.data.message, user: res.data.user };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Pendaftaran gagal.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('redor_obaba_token');
    localStorage.removeItem('redor_obaba_user');
    setUser(null);
    toast.success('Anda telah keluar dari aplikasi.');
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('redor_obaba_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        fetchProfile,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
