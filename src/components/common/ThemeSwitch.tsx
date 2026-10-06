import React from "react";
import styled from "styled-components";
import { useTheme } from "../../context/ThemeContext";

export const Switch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <StyledWrapper $isDark={isDark}>
      <div className="switch-wrapper">
        <span className={`label-end left-label ${!isDark ? "active" : ""}`}>
          LIGHT
        </span>
        <label className="switch" title="Toggle Dark / Light Mode">
          <input
            className="cb"
            type="checkbox"
            checked={isDark}
            onChange={toggleTheme}
          />
          <span className="toggle">
            <span className="left">light</span>
            <span className="right">dark</span>
          </span>
        </label>
        <span className={`label-end right-label ${isDark ? "active" : ""}`}>
          DARK
        </span>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $isDark: boolean }>`
  display: inline-flex;
  align-items: center;

  .switch-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    user-select: none;
  }

  .label-end {
    font-family: "JetBrains Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    font-weight: 700;
    text-transform: uppercase;
    transition: color 0.3s ease;
  }

  .left-label {
    color: ${(props) => (props.$isDark ? "rgba(255, 255, 255, 0.45)" : "#d40000")};
  }

  .right-label {
    color: ${(props) => (props.$isDark ? "#d40000" : "#000000")};
  }

  .label-end.active {
    color: #d40000;
  }

  /* The switch - the box around the slider */
  .switch {
    font-size: 12px;
    position: relative;
    display: inline-block;
    width: 5em;
    height: 2.5em;
    user-select: none;
    cursor: pointer;
  }

  /* Hide default HTML checkbox */
  .switch .cb {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  /* The slider */
  .toggle {
    position: absolute;
    cursor: pointer;
    width: 100%;
    height: 100%;
    background-color: #24242a;
    border-radius: 0.2em;
    transition: 0.4s;
    text-transform: uppercase;
    font-size: 8.5px;
    letter-spacing: 0.05em;
    font-weight: 700;
    overflow: hidden;
    box-shadow: -0.2em 0 0 0 #18181f, -0.2em 0.2em 0 0 #18181f,
      0.2em 0 0 0 #18181f, 0.2em 0.2em 0 0 #18181f, 0 0.2em 0 0 #18181f;
  }

  .toggle > .left {
    position: absolute;
    display: flex;
    width: 50%;
    height: 88%;
    background-color: #f3f3f3;
    color: #111111;
    left: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
    transform-origin: right;
    transform: rotateX(10deg);
    transform-style: preserve-3d;
    transition: all 150ms;
  }

  .left::before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background-color: rgb(206, 206, 206);
    transform-origin: center left;
    transform: rotateY(90deg);
  }

  .left::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background-color: rgb(112, 112, 112);
    transform-origin: center bottom;
    transform: rotateX(90deg);
  }

  .toggle > .right {
    position: absolute;
    display: flex;
    width: 50%;
    height: 88%;
    background-color: #f3f3f3;
    color: rgb(160, 160, 160);
    right: 1px;
    bottom: 0;
    align-items: center;
    justify-content: center;
    transform-origin: left;
    transform: rotateX(10deg) rotateY(-45deg);
    transform-style: preserve-3d;
    transition: all 150ms;
  }

  .right::before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background-color: rgb(206, 206, 206);
    transform-origin: center right;
    transform: rotateY(-90deg);
  }

  .right::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background-color: rgb(112, 112, 112);
    transform-origin: center bottom;
    transform: rotateX(90deg);
  }

  .switch input:checked + .toggle > .left {
    transform: rotateX(10deg) rotateY(45deg);
    color: rgb(160, 160, 160);
  }

  .switch input:checked + .toggle > .right {
    transform: rotateX(10deg) rotateY(0deg);
    color: #d40000;
  }
`;

export default Switch;
