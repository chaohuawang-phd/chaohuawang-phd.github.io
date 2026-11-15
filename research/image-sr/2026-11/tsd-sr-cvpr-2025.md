---
layout: page
title: TSD-SR CVPR 2025 论文精读
permalink: /research/image-sr/2026-11/tsd-sr-cvpr-2025/
description: 从目标分数蒸馏与分布感知采样理解 TSD-SR，并核对一步扩散超分的感知质量、像素保真、速度与证据边界。
nav: false
math: true
---

TSD-SR 把真实世界超分辨的扩散推理压到一步，并用目标分数蒸馏（TSD）与分布感知采样（DASM）缓解单步蒸馏常见的纹理失真。论文证据支持它在给定 A100、512×512 协议下取得强感知质量与速度折中；但 PSNR/SSIM 并非全面领先，用户研究没有置信区间或显著性分析，训练仍需 8 张 V100 约 120 小时。

精读日期：2026 年 11 月 15 日，北京时间。本文已读取官方会议 PDF 的 11 个页面序列与补充材料的 8 个页面序列，纳入 4 张论文原图；未运行代码或模型。

## 论文与读取范围

Linwei Dong、Qingnan Fan、Yihong Guo、Zhonghao Wang、Qi Zhang、Jinwei Chen、Yawei Luo、Changqing Zou，_TSD-SR: One-Step Diffusion with Target Score Distillation for Real-World Image Super-Resolution_，CVPR 2025，23174–23184。[官方记录](https://openaccess.thecvf.com/content/CVPR2025/html/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.html) · [正文](https://openaccess.thecvf.com/content/CVPR2025/papers/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2025/supplemental/Dong_TSD-SR_One-Step_Diffusion_CVPR_2025_supplemental.pdf)

以下“PDF 第 N 页”指文件页序，不是印刷页码。已核对正文 Figure 1–8、Table 1–4，补充材料 Table 5–7、Figure 9–13 与算法细节；结论只使用正文和补充材料能支持的范围。

## 研究问题：一步推理为何仍会失败

真实世界低质图像的退化未知且复合。多步扩散方法有强生成先验，但耗时；已有一步蒸馏方法更快，却可能过平滑、生成伪纹理或偏离输入结构。TSD-SR 的目标不是刷新所有协议下的 PSNR，而是在一步推理中改善感知质量与速度的折中。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig1-performance-efficiency.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig1-performance-efficiency.png' | relative_url }}" alt="TSD-SR 原图 1：A100 与 DRealSR 协议下 CLIPIQA、推理时间和采样步数的气泡图" width="660" height="620" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 1｜感知质量与推理效率。</strong>横轴是 A100 推理时间，纵轴是 CLIPIQA，气泡直径编码采样步数；TSD-SR 位于高速且较高 CLIPIQA 的区域。该图只支持 DRealSR 与论文计时口径下的比较，不能替代跨硬件基准。来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.pdf#page=1">Dong 等，CVPR 2025，Figure 1，正文 PDF 第 1 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

## 方法：TSD 与 DASM 如何协同

学生模型把低质图像直接映射为潜变量输出；冻结教师扩散模型提供先验，LoRA 副本拟合学生分布。像素空间 LPIPS 重建损失守住输入内容；TSD 组合教师在学生样本和高质参考样本上的预测，以及 LoRA 在学生样本上的预测；DASM 再沿扩散轨迹采样多个邻近状态，累计更有细节取向的梯度。训练时只更新学生 VAE 编码器与去噪网络，VAE 解码器冻结。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig2-pipeline.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig2-pipeline.png' | relative_url }}" alt="TSD-SR 原图 2：学生模型、教师模型、LoRA、DASM 与三类梯度的训练流程" width="1300" height="900" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 2｜训练信息流。</strong>橙/蓝为可训练组件，灰色为冻结组件；红线是 TSD 目标分布梯度，绿线是重建损失，蓝线用于更新 LoRA。学生分支和高质参考分支都经过 DASM，再进入教师/LoRA 分数比较。图示描述模块连接，不单独证明每个模块的性能贡献。来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.pdf#page=3">Dong 等，CVPR 2025，Figure 2，正文 PDF 第 3 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

### 目标分数蒸馏：公式与数值例

论文式 5：

$$
\nabla_\theta \mathcal{L}_{\mathrm{TSD}}
=\mathbb{E}_{t,\epsilon}\!\left[
w(t)\left(
\epsilon_\psi(\hat z_t)-\epsilon_\psi(z_t)
+\lambda\bigl(\epsilon_\psi(z_t)-\epsilon_\phi(\hat z_t)\bigr)
\right)
\frac{\partial \hat z}{\partial\theta}
\right].
$$

$\epsilon_\psi$ 是冻结教师，$\epsilon_\phi$ 是 LoRA，$\hat z_t$ 来自学生，$z_t$ 来自高质参考。第一项把学生状态拉向高质参考的教师分数，第二项以 LoRA 对学生分布的估计修正方向。

**数值算例。**仅为解释向量组合，令教师在学生状态的预测为 $[0.8,-0.2]$，教师在高质状态为 $[0.4,0]$，LoRA 在学生状态为 $[0.3,0.1]$，取 $\lambda=0.6$，并暂令 $w(t)=1$、雅可比为单位阵。基础差为 $[0.4,-0.2]$，修正为 $0.6([0.4,0]-[0.3,0.1])=[0.06,-0.06]$，合成方向为 $[0.46,-0.26]$。这些数值不是论文实验值，也不代表实际梯度大小。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig4-strategy-comparison.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig4-strategy-comparison.png' | relative_url }}" alt="TSD-SR 原图 4：鹦鹉眼部区域中朴素分数蒸馏、MSE 与作者方法的纹理对比" width="660" height="610" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 4｜错误方向、过平滑与 TSD。</strong>放大鹦鹉眼部可见，朴素策略出现伪纹理，MSE 更平滑，作者方法保留更清楚的眼圈和羽毛纹理。这是一个定性失败案例，能解释设计动机，但不能从单一样例外推总体胜率。来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.pdf#page=4">Dong 等，CVPR 2025，Figure 4，正文 PDF 第 4 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

### 分布感知采样：为什么不只看一个噪声点

DASM 采用论文式 6 沿轨迹推进：

$$
\hat z_{t-1}=\hat z_t+(\sigma_{t-1}-\sigma_t)\epsilon_\phi(\hat z_t;t,c_y).
$$

**数值算例。**若 $\sigma_t=0.70$、$\sigma_{t-1}=0.60$、$\hat z_t=[1.2,-0.4]$、$\epsilon_\phi=[0.5,-0.2]$，则下一状态为 $[1.15,-0.38]$。补充材料采用 $N=4$、步长 $s=50$；从一个起点得到四个间隔状态并累计梯度。Table 7 显示 $N=2$ 或 $8$ 都不如 $N=4$，而 $s=100$ 退化，因此“采样越多越好”并不成立。

## 训练与评测协议

- 训练数据：DIV2K、Flickr2K、LSDIR 及 FFHQ 前 10,000 张；使用 Real-ESRGAN 合成退化。
- 教师基座：Stable Diffusion 3；学生更新 VAE 编码器与去噪器，解码器冻结；LoRA 秩 64。
- 优化：学生 AdamW 学习率 $5\times10^{-6}$，LoRA 为 $10^{-6}$；8 张 V100、batch 16、约 120 小时。
- 测试：DRealSR、RealSR、DIV2K-Val；RealSR/DRealSR 成对裁剪为 $128\times128$ 低质与 $512\times512$ 高质。
- 指标：PSNR/SSIM 按 Y 通道；LPIPS、DISTS、FID 与 NIQE、MANIQA、MUSIQ、CLIPIQA 并列报告。不同数据、退化、采样步数或硬件下的数字不能直接横排。

## 核心结果：快，但不是所有指标都第一

| 数据集    | PSNR↑ | SSIM↑ | LPIPS↓ | DISTS↓ |    FID↓ | NIQE↓ | MUSIQ↑ | MANIQA↑ | CLIPIQA↑ |
| --------- | ----: | ----: | -----: | -----: | ------: | ----: | -----: | ------: | -------: |
| DRealSR   | 27.77 | .7559 |  .2967 |  .2136 |  134.98 | 5.9131 |  66.62 |   .5874 |    .7344 |
| RealSR    | 24.81 | .7172 |  .2743 |  .2104 |  114.45 | 5.1298 |  71.19 |   .6347 |    .7160 |
| DIV2K-Val | 23.02 | .5808 |  .2673 |  .1821 |   29.16 | 4.3244 |  71.69 |   .6192 |    .7416 |

对一步模型，TSD-SR 在多项感知/无参考指标领先，但 SinSR 或 OSEDiff 在部分 PSNR、SSIM、MANIQA 上更高。对多步模型，ResShift 仍有更高 PSNR/SSIM，AddSR 在 DRealSR 的 MANIQA 与 RealSR 的 MUSIQ/CLIPIQA 也可更高。准确结论是“在论文协议下取得强感知—速度折中”，不是“所有指标的绝对 SOTA”。

### 速度与消融

A100、512×512、排除权重/数据加载但包含文本提取、文本编码、VAE 与去噪网络时，TSD-SR 为 0.1362 秒，OSEDiff 0.1650 秒，SinSR 0.1424 秒，SeeSR 5.8167 秒。$5.8167/0.1362\approx42.71$，因此论文“超过 40 倍快于 SeeSR”的说法在该协议内成立；它不能外推到别的 GPU、分辨率或端到端服务延迟。

| 变体     | DRealSR DISTS↓ | MUSIQ↑ | MANIQA↑ | CLIPIQA↑ |
| -------- | -------------: | -----: | ------: | -------: |
| 去掉 TSM |          .2327 |  63.90 |   .5749 |    .6958 |
| 去掉 DASM |         .2311 |  63.56 |   .5812 |    .7123 |
| 完整模型 |     **.2136** | **66.62** | **.5874** | **.7344** |

两项组件在这组协议中都有贡献；但这是联合训练系统的移除实验，不能单独证明每个机制在所有数据集上的因果充分性。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig7-visual-comparisons.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/tsd-sr-cvpr-2025/fig7-visual-comparisons.png' | relative_url }}" alt="TSD-SR 原图 7：列车窗格与人眼区域的多种真实世界超分辨方法视觉对比" width="1320" height="650" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 7｜结构与纹理的视觉对照。</strong>上排比较列车窗格的规则结构，下排比较眼部纹理。作者方法在这两个样例中呈现更清楚的竖线与眼部细节；SUPIR 也生成大量高频纹理，但可能偏离参考。读图结论只针对展示的裁剪，视觉“更锐”不等于像素更忠实。来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_Super-Resolution_CVPR_2025_paper.pdf#page=8">Dong 等，CVPR 2025，Figure 7，正文 PDF 第 8 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

## 证据边界与失败风险

1. **用户研究。**正文报告 50 名参与者、5 类图像和 69.2% 偏好；补充材料另有与高 PSNR 方法比较的 90.28% 偏好。但论文没有置信区间、显著性检验、参与者抽样或一致性统计，不能把票数当作普适人类偏好。
2. **感知—失真权衡。**高纹理感知分数不等于像素更忠实；Figure 7 与补充 Figure 13 只能说明具体样例及作者设计的偏好任务，不能证明 PSNR/SSIM 普遍无效。
3. **模型规模。**作者明确承认，相比 GAN/非扩散方法参数量仍大，并提出剪枝/量化作为未来工作；正文没有在同一表中给出可核对的参数量。
4. **训练成本。**一步推理不等于训练便宜；论文报告 8 张 V100 训练约 120 小时。
5. **复现缺口。**部分理论推导借鉴并指向其他工作的附录；实际部署还需核对代码、默认提示词、文本提取器与数据预处理版本。本次没有运行代码，因此不宣称复现成功。

## 对研究设计的启示

TSD-SR 最值得保留的抽象是把“高质参考的教师分数”引入一步蒸馏方向，再用分布感知轨迹提供多个训练状态。Table 4 的移除实验、Table 7 的采样超参实验与 Figure 4 的失败案例形成相互支撑的证据链。最可信的结论是：在论文列出的真实世界数据集和 A100 计时协议下，它用一步推理取得强感知质量与速度；最需要保留的边界是像素保真、用户研究统计充分性、训练成本与模型规模。

去重记录：已按 CVPR 官方论文页、正式 PDF、补充材料、规范化标题、作者与年份关联为同一工作；未新增重复候选。检索窗口为 2022-01-01 至 2026-11-15，本次未把尚未覆盖的 ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 与 2022 年来源误报为零结果。

## 继续阅读

[本月候选与后续阅读清单]({{ '/research/image-sr/2026-11/' | relative_url }}) · [调研范围与研究路线]({{ '/research/image-sr/' | relative_url }}) · [栏目首页]({{ '/research/image-sr/' | relative_url }})
