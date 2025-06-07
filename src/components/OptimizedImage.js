import React from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  sizes = '100vw',
  quality = 75,
  ...props
}) => {
  // Convert image path to WebP if it's a local image
  const getWebPSrc = (imageSrc) => {
    if (typeof imageSrc === 'string' && imageSrc.startsWith('/')) {
      return imageSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
    }
    return imageSrc;
  };

  // Generate srcset for responsive images
  const generateSrcSet = (imageSrc) => {
    if (typeof imageSrc !== 'string' || !imageSrc.startsWith('/')) {
      return undefined;
    }

    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(width => `${imageSrc}?w=${width}&q=${quality} ${width}w`)
      .join(', ');
  };

  const webpSrc = getWebPSrc(src);
  const srcSet = generateSrcSet(src);
  const webpSrcSet = generateSrcSet(webpSrc);

  return (
    <picture>
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        {...props}
      />
    </picture>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  sizes: PropTypes.string,
  quality: PropTypes.number,
};

export default OptimizedImage; 