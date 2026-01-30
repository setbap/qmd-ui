/**
 * Type declarations for OpenTUI Solid JSX
 * This file provides JSX type information for OpenTUI components
 */

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      // Layout elements
      box: {
        children?: any;
        flexDirection?: "row" | "column";
        flexGrow?: number;
        width?: number | string;
        height?: number | string;
        gap?: number;
        padding?: number;
        paddingLeft?: number;
        paddingRight?: number;
        paddingTop?: number;
        paddingBottom?: number;
        margin?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        backgroundColor?: string;
        border?: boolean;
        borderStyle?: "single" | "double" | "rounded" | "bold";
        borderColor?: string;
        title?: string;
        alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
        justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
        onMouseDown?: () => void;
        onMouseUp?: () => void;
        style?: Record<string, any>;
      };

      scrollbox: {
        children?: any;
        focused?: boolean;
        height?: number | string;
        flexGrow?: number;
        padding?: number;
        style?: Record<string, any>;
      };

      // Text elements
      text: {
        children?: any;
        content?: string;
        fg?: string;
        bg?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        dimColor?: boolean;
        selectable?: boolean;
        onMouseDown?: () => void;
        width?: number;
      };

      span: {
        children?: any;
        fg?: string;
        bg?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
      };

      strong: { children?: any };
      em: { children?: any };
      i: { children?: any };
      u: { children?: any };
      br: {};
      a: { children?: any; href?: string };

      // Input elements
      input: {
        value: string;
        onInput: (value: string) => void;
        onChange?: (value: string) => void;
        onFocus?: () => void;
        onBlur?: () => void;
        placeholder?: string;
        focused?: boolean;
        width?: number;
        backgroundColor?: string;
        textColor?: string;
        cursorColor?: string;
        focusedBackgroundColor?: string;
        placeholderColor?: string;
      };

      textarea: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
        focused?: boolean;
        width?: number;
        height?: number;
        showLineNumbers?: boolean;
        wrapText?: boolean;
      };

      select: {
        options: Array<{ name: string; description?: string; value?: any }>;
        onSelect?: (index: number, option: any) => void;
        onChange?: (index: number, option: any) => void;
        selectedIndex?: number;
        focused?: boolean;
        height?: number;
        showScrollIndicator?: boolean;
        selectedBackgroundColor?: string;
        selectedTextColor?: string;
      };

      tab_select: {
        options: Array<{ name: string; description?: string; value?: any }>;
        onSelect?: (index: number, option: any) => void;
        onChange?: (index: number, option: any) => void;
        selectedIndex?: number;
        tabWidth?: number;
        focused?: boolean;
      };

      // Button
      button: {
        children?: any;
        onClick?: () => void;
      };

      // Code elements
      code: {
        code: string;
        language?: string;
        showLineNumbers?: boolean;
        highlightLines?: number[];
      };

      line_number: {
        code: string;
        language?: string;
        startLine?: number;
        highlightedLines?: number[];
      };

      diff: {
        oldCode: string;
        newCode: string;
        language?: string;
        mode?: "unified" | "split";
        showLineNumbers?: boolean;
      };

      // ASCII font
      ascii_font: {
        text: string;
        font?: "tiny" | "block" | "slick" | "shade";
        color?: string;
      };
    }
  }
}

export {};
