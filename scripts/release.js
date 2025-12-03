const { execSync } = require('child_process');

// Emoji 分类规则
const COMMIT_RULES = [
  { emoji: ':sparkles:', title: '✨ 新功能' },
  { emoji: ':bug:', title: '🐛 Bug 修复' },
  { emoji: ':ambulance:', title: '🚑 关键热修复' },
  { emoji: ':zap:', title: '⚡ 性能优化' },
  { emoji: ':lipstick:', title: '💄 UI/样式' },
  { emoji: ':recycle:', title: '♻️ 重构' },
  { emoji: ':memo:', title: '📝 文档' },
  { emoji: ':art:', title: '🎨 代码结构' },
  { emoji: ':fire:', title: '🔥 删除代码' },
  { emoji: ':rocket:', title: '🚀 部署' },
  { emoji: ':tada:', title: '🎉 初始化' },
  { emoji: ':lock:', title: '🔒 安全' },
  { emoji: ':arrow_up:', title: '⬆️ 升级依赖' },
  { emoji: ':arrow_down:', title: '⬇️ 降级依赖' },
  { emoji: ':heavy_plus_sign:', title: '➕ 添加依赖' },
  { emoji: ':heavy_minus_sign:', title: '➖ 移除依赖' },
  { emoji: ':wrench:', title: '🔧 配置' },
  { emoji: ':construction:', title: '🚧 进行中' },
  { emoji: ':boom:', title: '💥 重大变更' },
  { emoji: ':globe_with_meridians:', title: '🌐 国际化' },
  { emoji: ':wheelchair:', title: '♿ 无障碍' },
  { emoji: ':bento:', title: '🍱 资源更新' },
  { emoji: ':package:', title: '📦 构建/打包' },
  { emoji: ':truck:', title: '🚚 移动/重命名' },
  { emoji: ':alien:', title: '👽 外部API变更' },
  { emoji: ':building_construction:', title: '🏗️ 架构变更' },
  { emoji: ':iphone:', title: '📱 响应式设计' },
  { emoji: ':dizzy:', title: '💫 动画' },
  { emoji: ':adhesive_bandage:', title: '🩹 小修复' },
  { emoji: ':necktie:', title: '👔 业务逻辑' },
  { emoji: ':goal_net:', title: '🥅 错误捕获' },
  { emoji: ':rewind:', title: '⏪ 还原变更' },
];

// Emoji Unicode 到 shortcode 的映射
const EMOJI_MAP = {
  '✨': ':sparkles:',
  '🐛': ':bug:',
  '🚑': ':ambulance:',
  '⚡': ':zap:',
  '💄': ':lipstick:',
  '♻️': ':recycle:',
  '📝': ':memo:',
  '🎨': ':art:',
  '🔥': ':fire:',
  '🚀': ':rocket:',
  '🎉': ':tada:',
  '🔒': ':lock:',
  '⬆️': ':arrow_up:',
  '⬇️': ':arrow_down:',
  '➕': ':heavy_plus_sign:',
  '➖': ':heavy_minus_sign:',
  '🔧': ':wrench:',
  '🚧': ':construction:',
  '💥': ':boom:',
  '🌐': ':globe_with_meridians:',
  '♿': ':wheelchair:',
  '🍱': ':bento:',
  '📦': ':package:',
  '🚚': ':truck:',
  '👽': ':alien:',
  '🏗️': ':building_construction:',
  '📱': ':iphone:',
  '💫': ':dizzy:',
  '🩹': ':adhesive_bandage:',
  '👔': ':necktie:',
  '🥅': ':goal_net:',
  '⏪': ':rewind:',
};

function getCommits() {
  try {
    // 获取上一个 tag
    let previousTag;
    try {
      previousTag = execSync('git describe --tags --abbrev=0 HEAD^', { encoding: 'utf-8' }).trim();
    } catch {
      // 没有上一个 tag，获取所有 commits
      previousTag = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf-8' }).trim();
    }

    // 获取当前 tag 到上一个 tag 之间的 commits
    const logOutput = execSync(`git log ${previousTag}..HEAD --pretty=format:"%H|%s"`, { encoding: 'utf-8' });
    
    if (!logOutput.trim()) {
      return [];
    }

    return logOutput.trim().split('\n').map(line => {
      const [hash, ...messageParts] = line.split('|');
      return {
        hash: hash.substring(0, 7),
        message: messageParts.join('|')
      };
    });
  } catch (error) {
    console.error('获取 commits 失败:', error.message);
    return [];
  }
}

function detectEmoji(message) {
  // 检查 shortcode 格式 :emoji:
  for (const rule of COMMIT_RULES) {
    if (message.includes(rule.emoji)) {
      return rule.emoji;
    }
  }
  
  // 检查 Unicode emoji
  for (const [unicode, shortcode] of Object.entries(EMOJI_MAP)) {
    if (message.startsWith(unicode)) {
      return shortcode;
    }
  }
  
  return null;
}

function cleanMessage(message, emoji) {
  let cleaned = message;
  
  // 移除 shortcode
  if (emoji) {
    cleaned = cleaned.replace(emoji, '');
  }
  
  // 移除 Unicode emoji
  for (const unicode of Object.keys(EMOJI_MAP)) {
    cleaned = cleaned.replace(unicode, '');
  }
  
  return cleaned.trim().replace(/^:\s*/, '').replace(/^\s*/, '');
}

function generateChangelog(commits) {
  const categorized = {};
  const other = [];

  for (const commit of commits) {
    const emoji = detectEmoji(commit.message);
    
    if (emoji) {
      const rule = COMMIT_RULES.find(r => r.emoji === emoji);
      if (rule) {
        if (!categorized[rule.title]) {
          categorized[rule.title] = [];
        }
        categorized[rule.title].push({
          hash: commit.hash,
          message: cleanMessage(commit.message, emoji)
        });
        continue;
      }
    }
    
    other.push({
      hash: commit.hash,
      message: commit.message
    });
  }

  // 生成 Markdown
  let markdown = '';
  
  // 按规则顺序输出
  for (const rule of COMMIT_RULES) {
    if (categorized[rule.title] && categorized[rule.title].length > 0) {
      markdown += `## ${rule.title}\n\n`;
      for (const item of categorized[rule.title]) {
        markdown += `- ${item.message} (\`${item.hash}\`)\n`;
      }
      markdown += '\n';
    }
  }

  // 其他
  if (other.length > 0) {
    markdown += `## 📦 其他\n\n`;
    for (const item of other) {
      markdown += `- ${item.message} (\`${item.hash}\`)\n`;
    }
    markdown += '\n';
  }

  return markdown || '无更新内容';
}

// 主程序
const commits = getCommits();
console.log(`找到 ${commits.length} 个 commits`);

const changelog = generateChangelog(commits);
console.log('\n生成的更新日志:\n');
console.log(changelog);

// 输出到 GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  const fs = require('fs');
  // 使用 heredoc 格式处理多行内容
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `changelog<<EOF\n${changelog}\nEOF\n`);
}

