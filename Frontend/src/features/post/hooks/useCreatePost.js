import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../../services/client';

export const useCreatePost = () => {
  const [images, setImages] = useState([]); // Array of { file, previewUrl }
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  
  const [broadTopic, setBroadTopic] = useState(null);
  const [narrowTopic, setNarrowTopic] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
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

  const isValid = title.trim().length > 0 && broadTopic !== null;

  const submitPost = async (e) => {
    if (e) e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', body.trim());
      formData.append('broadTopicId', broadTopic);
      if (narrowTopic) {
        formData.append('narrowTopicId', narrowTopic);
      }
      
      if (images.length > 0) {
        formData.append('media', images[0].file);
        formData.append('type', 'image');
      }

      await client.post('/posts/create/', formData, {
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
    if (title.trim() || body.trim() || images.length > 0 || broadTopic || narrowTopic) {
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
    broadTopic,
    narrowTopic,
    isSubmitting,
    error,
    isValid,
    isCancelModalOpen,
    setIsCancelModalOpen,
    addImages,
    removeImage,
    setTitle,
    setBody,
    setBroadTopic,
    setNarrowTopic,
    submitPost,
    handleCancelClick,
    confirmCancel
  };
};
