import { useState, useEffect, useRef } from 'react';
import { personaApi } from '../api/personaApi';

export function useEditPersona({ isOpen, persona, onSaveSuccess, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && persona) {
      setFormData({
        name: persona.name || '',
        bio: persona.bio || '',
        avatarUrl: persona.avatarUrl || persona.imageUrl || '',
        bannerUrl: persona.bannerUrl || ''
      });
      setAvatarFile(null);
      setBannerFile(null);
      setErrorMsg('');
    }
  }, [isOpen, persona]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setFormData(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setFormData(prev => ({ ...prev, bannerUrl: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!persona?.id) return;

    setIsSubmitting(true);
    try {
      setErrorMsg('');
      const data = new FormData();
      data.append('name', formData.name);
      data.append('bio', formData.bio);
      if (avatarFile) data.append('avatar', avatarFile);
      if (bannerFile) data.append('banner', bannerFile);

      const response = await personaApi.updatePersona(persona.id, data);
      
      if (response?.success && response?.persona) {
        if (onSaveSuccess) onSaveSuccess(response.persona);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Failed to update persona:', error);
      if (error.response?.data?.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('Failed to update profile.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errorMsg,
    avatarFile,
    bannerFile,
    isSubmitting,
    avatarInputRef,
    bannerInputRef,
    handleChange,
    handleAvatarUpload,
    handleBannerUpload,
    handleSubmit
  };
}
