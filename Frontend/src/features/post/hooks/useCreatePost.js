import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../../services/client';

export const useCreatePost = () => {
  const [images, setImages] = useState([]); // Array of { file, previewUrl }
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [labels, setLabels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  
  const navigate = useNavigate();

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const addImages = useCallback((files) => {
    const newImages = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((indexToRemove) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[indexToRemove].previewUrl);
      newImages.splice(indexToRemove, 1);
      return newImages;
    });
  }, []);

  const toggleLabel = useCallback((label) => {
    setLabels(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, label];
    });
  }, []);

  const isValid = title.trim().length > 0 && images.length > 0 && labels.length > 0 && labels.length <= 3;

  const submitPost = async (e) => {
    if (e) e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', body.trim());
      formData.append('labelId', labels[0]); // Taking first label for now as per api docs
      
      images.forEach((img) => {
        formData.append('media', img.file);
      });

      await client.post('', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Success, navigate to home
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create post');
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (title.trim() || body.trim() || images.length > 0 || labels.length > 0) {
      setIsCancelModalOpen(true);
    } else {
      navigate(-1);
    }
  };

  const confirmCancel = () => {
    setIsCancelModalOpen(false);
    navigate(-1);
  };

  return {
    images,
    title,
    body,
    labels,
    isSubmitting,
    error,
    isValid,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isLabelModalOpen,
    setIsLabelModalOpen,
    addImages,
    removeImage,
    setTitle,
    setBody,
    toggleLabel,
    submitPost,
    handleCancelClick,
    confirmCancel
  };
};
