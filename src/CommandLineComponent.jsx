import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  messages: PropTypes.objectOf(PropTypes.func),
  commands: PropTypes.object.isRequired,
  prompt: PropTypes.string,
  autoFocus: PropTypes.bool
}

const defaultProps = {
  prompt: '> ',
  commands: {},
  messages: {
    'WELCOME_MESSAGE': () => '',
    'INVALID_COMMAND': () => 'Invalid command.'
  },
  autoFocus: true
}


class CommandLine extends React.Component { 
  constructor(props) {
    super(props);
    this.state = {
      buffer: [this.props.messages['WELCOME_MESSAGE']()],
      typingAllowed: true
    }
    this.promptRef = React.createRef();
    this.endLine = React.createRef();
    this._focusPrompt = this._focusPrompt.bind(this);
    this._appendToBufferArray = this._appendToBufferArray.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleEnter = this._handleEnter.bind(this);
  }

  _focusPrompt() {
    this.promptRef.current.focus();
  }

  _appendToBufferArray(fn) {
    this.tempBuffer = [...this.tempBuffer, fn()];
    this.endLine.current.scrollIntoView({ behavior: 'smooth' })
  }

  _handleEnter() {
    this._appendToBufferArray(() => this.props.prompt + this.promptRef.current.innerText);
    const input = this.promptRef.current.innerText.trim();
    const commandNameToRun = /^([^\s]*)\s?.*$/.exec(input)?.pop();
    // reset the prompt
    this.promptRef.current.innerText = '';
    // execute the command
    const command = this.props.commands[commandNameToRun];
    if(typeof command === 'undefined') {
      this._appendToBufferArray(this.props.messages['INVALID_COMMAND']);
      return;
    }
    // Parse out arguments
    const args = input.split(/\s+/).slice(1);
    if(command.isAsync) {
      // block console while async request is running
      this.setState({
        typingAllowed: false
      });
      command.fn(args).then(result => {
        this.setState({
          typingAllowed: true,
          buffer: [...this.state.buffer, result()]
        });
      });
    } else {
      const result = command.fn(args);
      this._appendToBufferArray(result);
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.tempBuffer = [...this.state.buffer];
      this._handleEnter();
      this.setState({
        buffer: this.tempBuffer
      });
    }
  }
  
  componentDidMount() {
    if(this.props.autoFocus) {
      this._focusPrompt();
    }
  }

  render() {
    const styles = this.props.styles || {};

    const lines = this.state.buffer.map((line, index) => <p key={index}>{line}</p>);

    return (
      
      <div style={styles.cli} onClick={this._focusPrompt} className="react_cli">
          {lines}
          <p  ref={this.endLine} style={{display: this.state.typingAllowed ? 'block' : 'none'}}><strong>{this.props.prompt}</strong><span spellCheck="false" contentEditable="true" onKeyDown={this._handleKeyDown} ref={this.promptRef} style={{display: 'inline-block', verticalAlign: 'top'}}></span></p>
      </div>
      
    );
  }
}

CommandLine.propTypes = propTypes;
CommandLine.defaultProps = defaultProps;

export default CommandLine;
