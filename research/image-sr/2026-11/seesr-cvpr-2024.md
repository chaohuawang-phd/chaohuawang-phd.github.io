---
layout: page
title: SeeSR CVPR 2024 论文精读
permalink: /research/image-sr/2026-11/seesr-cvpr-2024/
description: 从退化感知提示、硬软语义条件和 LR embedding 理解 SeeSR，并核对感知质量、输入忠实度、语义恢复与效率边界。
nav: false
math: true
---

SeeSR 的核心不是“把更多文本塞进扩散模型”，而是先从退化 LR 图像提取更可靠的语义提示，再用硬标签、软表征和 LR 图像三路条件约束 Stable Diffusion 2-base。论文证据支持它改善感知质量和下游语义恢复，但 PSNR/SSIM 并非全面领先；它仍可能因错误标签、区域错配和生成先验而产生不忠实细节。

精读日期：2026 年 11 月 13 日，北京时间。本文已读取官方正文 12 页与补充材料 5 页，纳入 4 张论文原图；未运行代码或模型。

## 论文与读取范围

Rongyuan Wu、Tao Yang、Lingchen Sun、Zhengqiang Zhang、Shuai Li、Lei Zhang，_SeeSR: Towards Semantics-Aware Real-World Image Super-Resolution_，CVPR 2024，25456–25467。[官方记录](https://openaccess.thecvf.com/content/CVPR2024/html/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.html) · [正文](https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2024/supplemental/Wu_SeeSR_Towards_Semantics-Aware_CVPR_2024_supplemental.pdf)

论文类型为算法方法。以下“PDF 第 N 页”指文件页序，不是印刷页码。已核对正文 Figure 1–6、Table 1–4，以及补充材料 Table 1–4 和定性图；公开结论只使用论文与补充材料可支持的范围。

## 为什么提示本身会成为风险

分类式提示通常只有一个全局类别，难以覆盖局部对象；描述式提示包含更多信息，却可能在重退化时把船误认成鸟；标签式提示覆盖更多实体，但同样容易被退化污染。Figure 1 把同一场景的不同提示与输出并列，显示语言先验既能补细节，也能放大语义错误。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig1-prompt-styles.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig1-prompt-styles.webp' | relative_url }}" alt="SeeSR 原图 1：同一低分辨率船只场景在分类式、描述式和标签式提示下的语义偏差" width="1290" height="820" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 1｜提示风格与语义漂移。</strong>对照 LR、HR 和不同提示的局部放大图：描述或标签错误会把船引向鸟或飞机。该图支持“提示可放大语义误差”，但不是各提示风格在总体分布上的胜率证据。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.pdf#page=3">Wu 等，CVPR 2024，Figure 1，正文 PDF 第 3 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

SeeSR 的回应是训练一个 degradation-aware prompt extractor（DAPE），让退化图像的语义表征和标签 logits 对齐到对应 HR 图像的标签模型输出。DAPE 不直接保证标签正确；它只是把提示提取从通用 RAM 转成针对退化图像的监督适配。

## 方法：DAPE 与三路控制

训练分两阶段。第一阶段从 RAM 初始化 DAPE：HR 图像通过冻结分支产生表征和 logits 锚点，随机退化后的 LR 图像通过可训练分支逼近这些锚点。第二阶段保留 DAPE 的硬提示（标签文本）和软提示（表征 embedding），再把 LR latent 送入 ControlNet 图像分支。Stable Diffusion 主干冻结，只训练图像编码器、ControlNet 和表示交叉注意力（RCA）等新增模块。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig2-framework.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig2-framework.webp' | relative_url }}" alt="SeeSR 原图 2：DAPE 训练、硬软提示和受控文本到图像扩散模型的整体框架" width="1290" height="920" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 2｜DAPE 与受控扩散框架。</strong>上部展示 HR/LR 对齐训练；下部展示硬提示、软表征和 LR 图像三路条件。图示证明模块连接与冻结/可训练范围，不单独证明性能提升。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.pdf#page=5">Wu 等，CVPR 2024，Figure 2，正文 PDF 第 5 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

### DAPE 目标函数

论文式 1：

$$
\mathcal{L}_{\mathrm{DAPE}}
=
\mathcal{L}_r\left(f_y^{\mathrm{rep}}, f_x^{\mathrm{rep}}\right)
+
\lambda\mathcal{L}_l\left(f_y^{\mathrm{logits}}, f_x^{\mathrm{logits}}\right),
\qquad \lambda=1.
$$

$x$ 是 HR 图像，$y$ 是退化 LR 图像；$\mathcal{L}_r$ 为表征 MSE，$\mathcal{L}_l$ 为 logits 的交叉熵。仅作量级直觉：若表征 MSE 为 0.04、logits 交叉熵为 0.22，则总损失为 $0.04+1\times0.22=0.26$。这个数值例子用于解释加权方式，不是论文实验值。

### 扩散目标

论文式 2：

$$
\mathcal{L}
=
\mathbb{E}\left[
\left\|
\epsilon-
\epsilon_\theta\left(z_t,z_{lr},t,p_h,p_s\right)
\right\|_2^2
\right].
$$

模型在带噪 HR latent $z_t$、LR latent $z_{lr}$、时间步 $t$、硬提示 $p_h$ 和软提示 $p_s$ 条件下预测噪声。若真实噪声为 $[0.5,-1.0]$、预测为 $[0.2,-0.6]$，单样本平方误差为 $0.3^2+(-0.4)^2=0.25$；这同样只是公式解释。

## LR embedding：忠实度与感知分数并非同向

Stable Diffusion 训练末端的 latent 并非完全随机噪声，但常见推理从纯高斯噪声开始。SeeSR 按训练噪声调度把 LR latent 嵌入初始噪声，缩小训练与推理起点差异。Figure 3 显示，LRE 能减少天空等平滑区域的虚假纹理。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig3-lre.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig3-lre.webp' | relative_url }}" alt="SeeSR 原图 3：多种扩散超分方法使用与不使用 LR embedding 时的天空伪纹理对比" width="650" height="490" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 3｜LRE 抑制平滑区域伪纹理。</strong>上排无 LRE、下排有 LRE；天空中的虚假纹理明显减少。该样例支持机制解释，量化取舍仍应以补充材料 Table 1 为准。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.pdf#page=5">Wu 等，CVPR 2024，Figure 3，正文 PDF 第 5 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

补充 Table 1 显示取舍：

| 数据集    | 指标    | 无 LRE | 有 LRE | 方向               |
| --------- | ------- | -----: | -----: | ------------------ |
| DIV2K-Val | PSNR    |  20.58 |  21.04 | 忠实度提高         |
| DIV2K-Val | LPIPS   | 0.3942 | 0.3876 | 全参考感知距离改善 |
| DIV2K-Val | FID     |  32.53 |  32.79 | 略差               |
| DIV2K-Val | CLIPIQA | 0.7314 | 0.6834 | 无参考感知分数下降 |
| DrealSR   | PSNR    |  26.55 |  27.90 | 忠实度提高         |
| DrealSR   | LPIPS   | 0.3952 | 0.3299 | 改善               |
| DrealSR   | FID     | 158.04 | 151.88 | 改善               |
| DrealSR   | CLIPIQA | 0.7248 | 0.6708 | 无参考感知分数下降 |

因此更准确的结论是：LRE 抑制额外但可能不忠实的纹理，常提高参考型忠实度；它并不保证 CLIPIQA 等无参考分数同步上升。

## 消融：硬提示与软提示承担不同角色

在退化 COCO 标签任务上，DAPE 相对 RAM 将 overall precision 从 0.7929 提高到 0.8940，overall recall 从 0.3711 提高到 0.3751，average precision 从 52.3 提高到 63.0。这个结果支持 DAPE 更适合退化输入，但评估仍基于同一合成退化和标签协议。

补充 Table 3 进一步显示：只用软提示时，一些数值指标优于只用硬提示，但定性样例会出现语义错误；硬提示补充离散对象类别，软提示补充阈值之外的连续视觉表征。两者联合时 DIV2K-Val FID 为 32.79、CLIPIQA 为 0.6834，优于表中单一路径的对应感知组合，但并非所有 PSNR/LPIPS 都最优。

## 实验结果如何读

不同数据、指标与任务不能合并成一个总榜：

| 证据          | SeeSR 结果                                           | 协议与边界                                         |
| ------------- | ---------------------------------------------------- | -------------------------------------------------- |
| DIV2K-Val     | PSNR 21.19；DISTS 0.2257；FID 31.93；CLIPIQA 0.6946  | $\times4$ 合成退化；全参考与无参考指标不可互换     |
| DrealSR       | PSNR 28.17；LPIPS 0.3189；FID 147.39；CLIPIQA 0.6804 | 真实配对数据；不同指标排序不一致                   |
| RealLR200     | NIQE 4.1620；MUSIQ 69.71；CLIPIQA 0.6813             | 无 GT，只能比较无参考指标                          |
| COCO 语义恢复 | PQ 30.0；检测 AP 21.1；实例 AP 18.5；mIoU 41.3       | 同一 OpenSeeD、合成退化；GT 为 52.5/49.1/43.8/62.0 |
| 用户研究      | 合成图与 GT 混淆率 38.6%；真实图最佳选择率 57.1%     | 20 人、16 合成+16 真实、每人 112 次；未报告显著性  |

SeeSR 的 PSNR 并非全面最好。例如 RealSR 上 SeeSR 为 25.18 dB，低于 DASR 的 27.02 dB；论文主要优势落在 FID、MUSIQ、CLIPIQA 和语义恢复指标。COCO 结果支持它在同一检测器和合成退化下保留更多可识别语义，却不能证明真实场景中所有生成细节都来自输入。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig4-qualitative.webp' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/seesr-cvpr-2024/fig4-qualitative.webp' | relative_url }}" alt="SeeSR 原图 4：船只与老车场景中多种真实图像超分方法的定性重建对比" width="1290" height="920" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 4｜语义与纹理的定性对照。</strong>船和老车两组样例显示，先验或提示错误会产生鱼、鸟或不规则结构；SeeSR 在这些样例中语义更稳。作者选例不能替代全数据集统计，也不能证明每个增强纹理都真实存在。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.pdf#page=7">Wu 等，CVPR 2024，Figure 4，正文 PDF 第 7 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

## 训练、成本与复现边界

训练数据为 LSDIR 与 FFHQ 前 10,000 张，采用 Real-ESRGAN 退化。DAPE 训练 20K iterations，batch 32，学习率 $10^{-4}$；主模型训练 150K iterations，batch 192，学习率 $5\times10^{-5}$，使用 8 张 V100 32GB，$\lambda=1$。推理采用 50 个 spaced DDPM steps。

补充 Table 4 按单张 V100 32GB、$128\times128\rightarrow512\times512$ 报告：SeeSR 约 2283.7M 参数、50 步、7.24s；PASD 为 1900.4M、20 步、6.07s；DiffBIR 为 1716.7M、50 步、5.85s；ResShift 为 173.9M、15 步、1.12s；Real-ESRGAN 为 16.7M、1 步、0.09s。SeeSR 不是高效方法；语义控制的收益带来显著参数和采样成本。

## 证据边界与失败模式

1. **错误提示仍会发生。**作者明确承认，重退化时 DAPE 可能给出错误标签；更好的平均标签指标不是逐图正确保证。
2. **提示没有显式空间对齐。**标签与对应区域只通过扩散模型内部注意力关联，可能出现对象—区域错配。
3. **小文字困难。**论文指出小文本仍难重建；生成式锐化不等于恢复真实字符。
4. **感知与忠实度冲突。**LRE 的结果说明减少伪纹理可提高 PSNR/LPIPS，却降低 CLIPIQA；单一无参考指标不能定义“更真实”。
5. **下游与用户证据有限。**COCO 使用同一检测器与合成退化；用户研究未报告置信区间或显著性。
6. **未做代码复现。**本次只核验正文、补充材料和原图，不宣称训练、推理或结果复现成功。

## 对研究设计的启示

SeeSR 最值得保留的抽象是把“生成先验”拆成三种条件：离散标签提供对象级约束，连续表征补充低信息标签，LR 图像分支保留结构。真正需要继续验证的是错误标签时的失效检测、标签与区域的显式对齐、少步蒸馏能否保留语义稳定性，以及在同一硬件和采样预算下，感知指标、输入忠实度与下游语义是否仍能同时改善。

## 继续阅读

[本月候选与后续阅读清单]({{ '/research/image-sr/2026-11/' | relative_url }}) · [调研范围与研究路线]({{ '/research/image-sr/' | relative_url }}) · [栏目首页]({{ '/research/image-sr/' | relative_url }})
