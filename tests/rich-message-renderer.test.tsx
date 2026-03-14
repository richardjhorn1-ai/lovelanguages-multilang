import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RichMessageRenderer from '../components/chat/RichMessageRenderer';

const speakMock = vi.fn();

vi.mock('../services/audio', () => ({
  speak: (...args: any[]) => speakMock(...args),
}));

const t = (key: string, defaultValue?: string) => defaultValue || key;

describe('RichMessageRenderer', () => {
  it('renders the culture, slang, and drill labels', () => {
    render(
      <RichMessageRenderer
        content={`::: culture
Tone matters here.
:::

::: slang
Use this with close friends.
:::

::: drill
Say this tonight.
:::`}
        t={t}
        targetLanguage="es"
      />
    );

    expect(screen.getByText('Culture Note')).toBeInTheDocument();
    expect(screen.getByText('Native Usage')).toBeInTheDocument();
    expect(screen.getByText('Practice Challenge')).toBeInTheDocument();
  });

  it('renders an explicit table block and keeps following prose outside the table', () => {
    render(
      <RichMessageRenderer
        content={`::: table
| Person | Form |
| --- | --- |
| I | amo |
:::

After the table, keep practicing.`}
        t={t}
        targetLanguage="es"
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('After the table, keep practicing.')).toBeInTheDocument();
  });

  it('falls back to text when an explicit table block is not actually a table', () => {
    render(
      <RichMessageRenderer
        content={`::: table
Intro
---
Outro
:::`}
        t={t}
        targetLanguage="es"
      />
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/Intro/)).toBeInTheDocument();
    expect(screen.getByText(/Outro/)).toBeInTheDocument();
  });

  it('preserves markdown formatting and TTS click handling inside block bodies', () => {
    const { container } = render(
      <RichMessageRenderer
        content={`::: culture
Try **kocham** [KO-ham] tonight.
:::`}
        t={t}
        targetLanguage="pl"
      />
    );

    const ttsWord = container.querySelector('.tts-word');
    expect(ttsWord).not.toBeNull();
    expect(ttsWord).toHaveTextContent('kocham');
    expect(screen.getByText('(KO-ham)')).toBeInTheDocument();

    fireEvent.click(ttsWord!);
    expect(speakMock).toHaveBeenCalledWith('kocham', 'pl');
  });
});
