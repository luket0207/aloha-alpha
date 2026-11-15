import { createElement, useMemo } from 'react';
import ImageDivider from './ImageDivider.jsx';
import { imageDividerDataFromElement, imageDividerHeightFromElement } from './imageDivider.js';
import ImageFrame from './ImageFrame.jsx';
import { imageFrameDataFromElement } from './imageFrame.js';
import TextImageSection from './TextImageSection.jsx';
import {
  normalizeTextImageColorScheme,
  normalizeTextImageLayout,
  normalizeTextImageWidth,
} from './textImageSection.js';

const ATTRIBUTE_NAMES = {
  class: 'className',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  fetchpriority: 'fetchPriority',
  for: 'htmlFor',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
};

function styleObject(element) {
  return Array.from(element.style).reduce((styles, property) => {
    const reactProperty = property.startsWith('--')
      ? property
      : property.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    styles[reactProperty] = element.style.getPropertyValue(property);
    return styles;
  }, {});
}

function elementProps(element, key) {
  const props = { key };

  Array.from(element.attributes).forEach(({ name, value }) => {
    if (name === 'style') {
      props.style = styleObject(element);
      return;
    }

    props[ATTRIBUTE_NAMES[name] || name] = value;
  });

  return props;
}

function renderWordPressNode(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  if (node.matches('.wp-block-aloha-image-frame')) {
    const frame = imageFrameDataFromElement(node);
    return frame ? <ImageFrame {...frame} key={key} /> : null;
  }

  if (node.matches('.wp-block-aloha-image-divider')) {
    const image = imageDividerDataFromElement(node);
    return image
      ? <ImageDivider dividerHeight={imageDividerHeightFromElement(node)} image={image} key={key} />
      : null;
  }

  if (node.matches('.wp-block-aloha-text-image-side-by-side')) {
    const layout = normalizeTextImageLayout(node.dataset.layout);
    const imageWidth = normalizeTextImageWidth(node.dataset.imageWidth);
    const frameElement = node.querySelector('.aloha-text-image__media .wp-block-aloha-image-frame');
    const frame = frameElement ? imageFrameDataFromElement(frameElement) : null;
    const titleElement = node.querySelector(':scope > .aloha-text-image__title');
    const contentElement = node.querySelector('.aloha-text-image__content');
    const content = contentElement
      ? Array.from(contentElement.childNodes).map((child, index) => (
        renderWordPressNode(child, `${key}-content-${index}`)
      ))
      : null;

    return (
      <TextImageSection
        bottomWave={node.dataset.bottomWave === 'true'}
        colorScheme={normalizeTextImageColorScheme(node.dataset.colorScheme)}
        content={content}
        image={frame ? <ImageFrame {...frame} /> : null}
        imageWidth={imageWidth}
        key={key}
        layout={layout}
        title={titleElement ? renderWordPressNode(titleElement, `${key}-title`) : null}
        topWave={node.dataset.topWave === 'true'}
      />
    );
  }

  const children = Array.from(node.childNodes).map((child, index) => (
    renderWordPressNode(child, `${key}-${index}`)
  ));

  return createElement(node.tagName.toLowerCase(), elementProps(node, key), ...children);
}

function parseWordPressContent(html) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(parsed.body.childNodes).map((node, index) => (
    renderWordPressNode(node, `wordpress-node-${index}`)
  ));
}

export default function WordPressContent({ className, html }) {
  const content = useMemo(() => parseWordPressContent(html), [html]);
  return <article className={className}>{content}</article>;
}
