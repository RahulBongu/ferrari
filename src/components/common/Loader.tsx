import React from "react";
import styled from "styled-components";

interface LoaderProps {
  scale?: number;
  label?: string;
  onPress?: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ scale = 0.7, label, onPress }) => {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <StyledWrapper>
          <div className="wrapper">
            <div className="container">
              <div className="roller">
                <div className="handle" />
              </div>
              <div className="paint" />
            </div>
          </div>
        </StyledWrapper>
      </div>
      {label && (
        <span className="font-mono-tech text-xs uppercase tracking-[0.3em] text-white/80 dark:text-white/80 light:!text-zinc-900 mt-2 font-bold animate-pulse text-center">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={onPress}
        className="mt-3 px-6 py-2 bg-[#d40000] hover:bg-[#b50000] !text-white font-mono-tech text-xs font-bold uppercase tracking-[0.25em] rounded-full shadow-[0_0_20px_rgba(212,0,0,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/20 flex items-center gap-2"
      >
        <span>PRESS HERE</span>
      </button>
    </div>
  );
};

const StyledWrapper = styled.div`
  .container {
    height: 350px;
    width: 350px;
    -webkit-transform: rotate(-45deg);
    -ms-transform: rotate(-45deg);
    transform: rotate(-45deg);
  }
  .roller {
    height: 45px;
    width: 150px;
    border: 5px solid #040e15;
    border-radius: 7px;
    background-image: -webkit-gradient(
      linear,
      left top,
      left bottom,
      color-stop(0, #fc8f2e),
      color-stop(80%, #fc8f2e),
      color-stop(80%, #e86f1a)
    );
    background-image: -o-linear-gradient(
      top,
      #fc8f2e 0,
      #fc8f2e 80%,
      #e86f1a 80%
    );
    background-image: linear-gradient(
      to bottom,
      #fc8f2e 0,
      #fc8f2e 80%,
      #e86f1a 80%
    );
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    -webkit-animation: roller 2s infinite;
    animation: roller 2s infinite;
  }
  @-webkit-keyframes roller {
    40% {
      top: 165px;
    }
  }
  @keyframes roller {
    40% {
      top: 165px;
    }
  }
  .roller:before {
    position: absolute;
    content: "";
    background-color: rgba(255, 255, 255, 0.7);
    height: 7px;
    width: 75px;
    top: 8px;
    left: 8px;
    border-radius: 10px;
  }
  .roller:after {
    position: absolute;
    content: "";
    height: 40px;
    width: 85px;
    border: 7px solid #040e15;
    border-left: none;
    right: -20px;
    top: 20px;
    z-index: -1;
    border-radius: 7px;
  }
  .handle {
    height: 30px;
    width: 7px;
    background-color: #040e15;
    position: absolute;
    top: 68px;
    right: 65px;
  }
  .handle:after {
    position: absolute;
    content: "";
    height: 75px;
    width: 25px;
    background-color: #040e15;
    bottom: -75px;
    right: -8px;
    border-radius: 5px;
  }
  .paint {
    background-color: #fc8f2e;
    height: 0;
    width: 130px;
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    z-index: -1;
    -webkit-animation: paint 2s infinite;
    animation: paint 2s infinite;
  }
  @-webkit-keyframes paint {
    40% {
      height: 165px;
    }
  }
  @keyframes paint {
    40% {
      height: 165px;
    }
  }
`;

export default Loader;
