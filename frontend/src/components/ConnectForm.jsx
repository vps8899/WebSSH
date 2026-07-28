import React, { useState } from 'react';
import { TerminalSquare, ShieldAlert, LogIn } from 'lucide-react';
import './ConnectForm.css';

export default function ConnectForm({ onConnect, isConnecting }) {
  const [formData, setFormData] = useState({
    host: '',
    port: '22',
    username: 'root',
    password: '',
    privateKey: ''
  });
  const [authMethod, setAuthMethod] = useState('password');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(formData);
  };

  return (
    <div className="connect-container">
      <div className="glass-panel connect-card">
        <div className="card-header">
          <TerminalSquare size={32} className="logo-icon" />
          <h1>VPS风向标的WebSSH</h1>
          <p className="subtitle">Secure WebSocket Terminal</p>
        </div>

        <div className="privacy-notice">
          <ShieldAlert size={18} className="notice-icon" />
          <div>
            <strong>隐私及安全声明</strong>
            <p>我们非常注重您的隐私。此服务仅作为 SSH 流量的安全代理，<strong>绝不会保存</strong>您的服务器密码或私钥。所有连接信息均在您的浏览器内存和代理服务器内存中流转，连接断开即彻底销毁。</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="connect-form">
          <div className="form-row">
            <div className="form-group flex-3">
              <label>主机 (Host/IP)</label>
              <input 
                type="text" 
                name="host" 
                className="input-field" 
                value={formData.host} 
                onChange={handleChange} 
                placeholder="192.168.1.100"
                required 
              />
            </div>
            <div className="form-group flex-1">
              <label>端口 (Port)</label>
              <input 
                type="number" 
                name="port" 
                className="input-field" 
                value={formData.port} 
                onChange={handleChange} 
                placeholder="22"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>用户名 (Username)</label>
            <input 
              type="text" 
              name="username" 
              className="input-field" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder="root"
              required 
            />
          </div>

          <div className="auth-tabs">
            <button 
              type="button" 
              className={`tab ${authMethod === 'password' ? 'active' : ''}`}
              onClick={() => setAuthMethod('password')}
            >
              密码登录
            </button>
            <button 
              type="button" 
              className={`tab ${authMethod === 'privateKey' ? 'active' : ''}`}
              onClick={() => setAuthMethod('privateKey')}
            >
              密钥登录
            </button>
          </div>

          {authMethod === 'password' ? (
            <div className="form-group">
              <label>密码 (Password)</label>
              <input 
                type="password" 
                name="password" 
                className="input-field" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••"
                required={authMethod === 'password'} 
              />
            </div>
          ) : (
            <div className="form-group">
              <label>私钥 (Private Key)</label>
              <textarea 
                name="privateKey" 
                className="input-field textarea" 
                value={formData.privateKey} 
                onChange={handleChange} 
                placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                rows="4"
                required={authMethod === 'privateKey'}
              />
            </div>
          )}

          <button type="submit" className="btn connect-btn" disabled={isConnecting}>
            <LogIn size={18} />
            {isConnecting ? '连接中...' : '连接服务器'}
          </button>
        </form>
      </div>
    </div>
  );
}
