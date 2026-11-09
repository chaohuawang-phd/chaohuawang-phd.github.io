---
layout: page
title: VOSR CVPR 2026 论文精读
permalink: /research/image-sr/2026-11/vosr-cvpr-2026/
description: 从双视觉条件、部分条件引导与一步蒸馏分析 VOSR 的质量、忠实度和成本边界。
nav: false
math: true
---

VOSR 是一条刻意绕开文本到图像扩散底座的真实世界超分辨路线：它只使用视觉编码器和原生训练的扩散 Transformer，把低分辨率图像同时编码为像素结构条件与视觉语义条件，再用“部分条件分支”构造面向复原的引导方向。论文最有价值的结论不是某个单项指标第一，而是证明了视觉语义先验、输入锚定的引导和一步蒸馏可以在同一框架内兼顾感知质量、输入忠实度与速度。

# 论文身份与证据范围

- **论文**：Ruiyang Wu 等，*VOSR: A Vision-Only Generative Model for Image Super-Resolution*，CVPR 2026，页 16311–16321。
- **正式证据**：[CVPR 论文页](https://openaccess.thecvf.com/content/CVPR2026/html/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.html)、[正式 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.pdf) 与补充材料。
- 本页核验了正文、附录中的蒸馏细节、训练配方、视觉语义编码器和部分条件消融、用户研究及补充视觉对比。正文与补充材料能支持论文内部比较，不能自动推出跨硬件、跨数据或未匹配训练预算下的普遍领先。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig1-performance-cost.png' | relative_url }}" target="_blank" rel="noopener"><img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig1-performance-cost.png' | relative_url }}" alt="VOSR 原图 1：感知性能、参数效率与训练像素成本对比" width="1500" height="760" loading="lazy" decoding="async"></a>
  <figcaption><strong>原图 1｜性能、效率与训练成本。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2026/papers/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.pdf#page=2">Wu 等，CVPR 2026，Figure 1，PDF 第 2 页</a>。点击查看原尺寸；保留坐标轴、图例与英文图注。</figcaption>
</figure>

图 1（原论文 Figure 1，PDF 第 2 页）：左侧同时比较感知指标、参数量和训练像素成本。应重点看三组坐标轴与蓝/橙/黑方法类别，而不是只看一个“最好”点。它支持“VOSR 在论文设定下形成质量—效率—训练成本折中”，不等于完整生命周期成本最低；作者明确没有把预训练 VAE 和视觉编码器的既有成本计入蓝条。

# 方法链条

## 双视觉条件

高分辨率图像先经 VAE 得到潜变量 $z_0=E(I_{HR})$，噪声为 $z_1$。训练时采用线性流路径

$$z_t=(1-t)z_0+t z_1,\qquad v_t=z_1-z_0.$$

低分辨率图像被拆成两个条件：$c_{str}=E(I_{LR})$ 保留空间结构，$c_{sem}=V(I_{LR})$ 由预训练视觉编码器提取高层、但仍由输入图像定位的语义。结构 token 与噪声 token 拼接后进入扩散 Transformer，语义 token 通过交叉注意力注入。

**数值例子。** 若一维潜变量 $z_0=2$、$z_1=-1$、$t=0.25$，则 $z_t=1.25$、目标速度 $v_t=-3$。从 $z_t$ 沿速度反推 $t$ 的距离，$z_t-t v_t=1.25-0.25(-3)=2$，回到干净端点。真实模型在高维潜空间预测这个速度场。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig2-framework.png' | relative_url }}" target="_blank" rel="noopener"><img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig2-framework.png' | relative_url }}" alt="VOSR 原图 2：双视觉条件、扩散主干与复原引导框架" width="1500" height="1120" loading="lazy" decoding="async"></a>
  <figcaption><strong>原图 2｜VOSR 框架与条件策略。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2026/papers/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.pdf#page=4">Wu 等，CVPR 2026，Figure 2，PDF 第 4 页</a>。点击查看原尺寸；保留模块、图例与英文图注。</figcaption>
</figure>

图 2（原论文 Figure 2，PDF 第 4 页）：左侧是原生视觉扩散主干，右侧对比仅结构条件、结构加视觉语义条件，以及标准 CFG 与论文的部分条件引导。该图支持模块关系；“视觉语义更可靠”仍要由消融和视觉结果共同判断。

## 面向复原的部分条件引导

标准 CFG 需要无条件分支，但小规模复原训练很难把真正无条件分支训练稳定。VOSR 改为保留弱结构锚点、去掉高层语义的部分条件分支：

$$v_{guide}=v_{pcond}+s\bigl(v_{cond}-v_{pcond}\bigr).$$

若 $v_{pcond}=0.2$、$v_{cond}=0.5$、$s=2$，则 $v_{guide}=0.8$。这不是在两个预测之间简单平均，而是沿“弱条件到完整条件”的方向外推；较大 $s$ 在该设计里更强调输入锚定的复原，论文 Figure 4 显示 LPIPS 上升、MUSIQ 下降，即生成自由度降低。

补充材料 Table 5 在 LSDIR 上给出：仅完整条件 LPIPS 0.3752、MUSIQ 67.29；标准 CFG 为 0.4053、50.78；部分条件为 0.3772、69.26。它支持“部分条件比标准无条件 CFG 更稳定”，但 LPIPS 与 MUSIQ 的方向并不一致，不能把它缩成单一胜负。

## 从多步到一步

作者先训练多步教师，再在相同条件与引导方向下蒸馏一步模型。补充材料比较 shortcut 与递归一致性变体，并公开 256 像素预训练 400K 步、512 像素预训练 400K 步、一步蒸馏 50K 步的配方。一步版本不是零成本捷径，而是把多步教师的轨迹知识压缩到单次预测。

# 实验如何读

| 证据 | 论文报告 | 能支持什么 | 不能支持什么 |
|---|---:|---|---|
| 512×512、A100 FP16，一步推理 | 0.5B 0.094 s；1.4B 0.095 s | 同表实现下的一步速度具有竞争力 | 不能外推到任意显卡、分辨率或端到端 I/O |
| RealSR，VOSR-1.4B 多步 | MUSIQ 70.4718；PSNR 25.2886 | 感知分数强，同时维持一定失真保真度 | PSNR 不是表中最高，不能称全面领先 |
| RealSR，VOSR-1.4B 一步 | MUSIQ 70.5813；LPIPS 0.2732 | 一步版本仍保持较强感知质量 | 不证明所有视觉细节都是真实恢复 |
| 视觉语义编码器消融 | 无 SVE：MUSIQ 63.74；DINOv2：68.23 | 视觉语义条件在该训练设定下有效 | 编码器自身预训练成本未被消除 |

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig3-qualitative.png' | relative_url }}" target="_blank" rel="noopener"><img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig3-qualitative.png' | relative_url }}" alt="VOSR 原图 3：多步与一步模型在桥梁和字符上的视觉对比" width="1500" height="720" loading="lazy" decoding="async"></a>
  <figcaption><strong>原图 3｜多步与一步真实退化对比。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2026/papers/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.pdf#page=8">Wu 等，CVPR 2026，Figure 3，PDF 第 8 页</a>。点击查看原尺寸；保留裁框、方法名与英文图注。</figcaption>
</figure>

图 3（原论文 Figure 3，PDF 第 8 页）：上排为多步、下排为一步，在桥梁细线和字符上对比 T2I 与 vision-only 方法。应看红框内线条是否连续、字符轮廓是否与 LR 约束一致。它是代表性个案，支持“VOSR 在这些样本上减少结构扭曲”，不代表所有图像都不会幻觉。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig7-additional-qualitative.png' | relative_url }}" target="_blank" rel="noopener"><img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/vosr-cvpr-2026/fig7-additional-qualitative.png' | relative_url }}" alt="VOSR 补充原图 7：符号、文字、窗格和艺术图案的多方法对比" width="1500" height="1950" loading="lazy" decoding="async"></a>
  <figcaption><strong>补充原图 7｜额外多步与一步视觉对比。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2026/supplemental/Wu_VOSR_A_Vision-Only_CVPR_2026_supplemental.pdf#page=7">Wu 等，CVPR 2026 补充材料，Figure 3，补充 PDF 第 7 页；合并长版 PDF 顺序第 16 页</a>。点击查看原尺寸。</figcaption>
</figure>

图 4（原论文补充 Figure 7，PDF 顺序第 16 页）：六组额外多步/一步对比覆盖符号、文字、窗格和艺术图案。多例一致性增强了定性证据，但仍是作者选择的样本；精确数值结论应回到可编辑表格与协议。

# 判断与局限

1. **论文的核心贡献成立在“视觉先验也可形成生成式 SR 底座”这一问题上。** 它并没有否认预训练：VAE 和 DINOv2 等视觉编码器仍是外部先验，只是不依赖文本对齐的 T2I 生成空间。
2. **感知—失真冲突没有被消除。** 多个表中 MUSIQ、LPIPS、PSNR/SSIM 排名分裂；VOSR 的强项是折中与结构忠实，而非所有指标同时最优。
3. **训练成本说法有清晰边界。** “低于 T2I 路线十分之一”的比较按主干训练像素统计，排除了复用编码器的历史训练成本，也不等于能耗、工程人时或总数据治理成本。
4. **规模仍是限制。** 作者明确承认其数据与模型规模落后于 10B 级 T2I 底座；在更大视觉模型、更多领域退化和极端放大倍率上是否保持优势，仍需独立验证。

# 可复现检查清单

- 固定相同退化、输出分辨率、采样步数定义和硬件计时口径，再比较速度与质量。
- 分开报告 PSNR/SSIM、LPIPS/DISTS 和无参考指标，不合成单一“总分”。
- 对文本、细线、重复纹理单独做输入一致性检查，并记录失败样本。
- 复现时注明 VAE、视觉编码器及其权重来源；不要把“vision-only”误写成“从零训练”。

方法说明：全文与补充材料的证据边界、公式拆解和协议核查流程参考 Kassis 等人的 [Scientific Agent Skills](https://arxiv.org/abs/2609.00065)（arXiv:2609.00065，2026）。

