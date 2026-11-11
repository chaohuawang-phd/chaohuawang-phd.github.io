---
layout: page
title: ATD CVPR 2024 论文精读
permalink: /research/image-sr/2026-11/atd-cvpr-2024/
description: 从自适应 token 字典、跨注意力与类别内全局注意力理解 ATD，并核对消融、复杂度和经典超分协议边界。
nav: false
math: true
---

ATD 的核心不是简单把窗口做大，而是增加一个远小于图像 token 数量的可学习字典：先用字典跨注意力向每个位置传播训练集先验，再利用同一张相似度图把远距离但纹理相近的 token 归类，在类内做自注意力。论文证据支持这三部分在经典 bicubic 超分辨中提供增量收益，但也显示 learned grouping 相对随机 grouping 的净增益较小，且 ATD 的 FLOPs 并不低于 HAT。

精读日期：2026 年 11 月 11 日，北京时间。本文已读取官方正文与补充材料，纳入 4 张论文原图；未运行代码或模型。

## 论文与读取范围

Leheng Zhang、Yawei Li、Xingyu Zhou、Xiaorui Zhao、Shuhang Gu，_Transcending the Limit of Local Window: Advanced Super-Resolution Transformer with Adaptive Token Dictionary_，CVPR 2024，2856–2865，DOI：10.1109/CVPR52733.2024.00276。[官方记录](https://openaccess.thecvf.com/content/CVPR2024/html/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.html) · [正文](https://openaccess.thecvf.com/content/CVPR2024/papers/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2024/supplemental/Zhang_Transcending_the_Limit_CVPR_2024_supplemental.pdf)

论文类型为算法方法。已读取正文 PDF 全部 10 页与补充材料全部 6 页，包括正文图 1–5、表 1–5，补充表 B.1–B.3 和图 C.1–C.4。以下“PDF 第 N 页”指文件页序，不是印刷页码。

## 为什么引入 token 字典

固定窗口注意力只在局部交换信息；直接扩大窗口会带来二次复杂度。ATD 让每个图像 token 先查询一个较小的字典，形成全图 token 到字典原子的相似度图，再把这张图同时用于特征增强、字典更新和类别划分。图 1 将三种信息路径并列：局部窗口、字典汇聚的外部先验、类别内远程连接。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig1-attention-mechanisms.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig1-attention-mechanisms.png' | relative_url }}" alt="ATD 原图 1：窗口自注意力、token 字典跨注意力与类别自注意力的连接范围对比" width="1160" height="405" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 1｜三种注意力机制。</strong>先比较三张图中虚线连接范围：窗口注意力只读局部；TDCA 通过小字典汇聚训练集先验；类别注意力把远距离但相似的 token 连接起来。该图解释信息路径，不是计算量或精度证据。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.pdf#page=1">Zhang 等，CVPR 2024，图 1，正文 PDF 第 1 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

这一设计把“全局信息”拆成两类。TDCA 使用训练数据学到的字典值给所有位置补充外部先验；AC-MSA 则在当前图像内，让空间上相距较远但被判为同一类别的 token 直接交互。二者不能互换：前者的键和值来自字典，后者的键和值仍来自当前图像特征。

## 方法如何工作

输入特征为 $X\in\mathbb{R}^{N\times d}$，字典为 $D\in\mathbb{R}^{M\times d}$，且 $M\ll N$。标准 ATD 采用 6 个 ATD block，每个 block 有 6 个 Transformer layer，通道数 210；字典为 $128\times210$，降维比 $r=10.5$，相似度维度为 20，类别子组大小 $n_s=128$。三个并行分支分别是 shifted-window MSA、TDCA 和 AC-MSA，输出相加后进入 FFN。ATD-light 使用 48 通道、4 个 block、64 个字典 token 和 $r=6$。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig2-tdca-acmsa.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig2-tdca-acmsa.png' | relative_url }}" alt="ATD 原图 2：TDCA 与 AC-MSA 的计算流程" width="1160" height="410" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 2｜TDCA 与 AC-MSA。</strong>左图从图像 query 到字典 key/value，得到全图到字典的注意力图；右图用同一张图分类、分组并做类内 MSA。图中省略了大类别继续切成固定大小子类别的细节，不能据此认定所有组都只含同一类别。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.pdf#page=4">Zhang 等，CVPR 2024，图 2，正文 PDF 第 4 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

### TDCA：把图像 token 映射到小字典

论文式 3–4：

$$Q_X=XW^Q,\qquad K_D=DW^K,\qquad V_D=DW^V,$$

$$A=\operatorname{Softmax}\left(\operatorname{Sim}_{\cos}(Q_X,K_D)/\tau\right),\qquad \operatorname{TDCA}=AV_D.$$

$W^Q,W^K\in\mathbb{R}^{d\times d/r}$，$W^V\in\mathbb{R}^{d\times d}$；$A\in\mathbb{R}^{N\times M}$，$\tau$ 可学习。复杂度随 $N\times M$ 增长；当 $M\ll N$ 时，它避开 $N\times N$ 的全局自注意力。

**数字算例。**取两个 query 与两个字典 key：$Q=[(1,0),(0,1)]$，$K=[(1,0),(0.6,0.8)]$，$\tau=1$。余弦相似度两行为 $[1,0.6]$ 与 $[0,0.8]$，softmax 后约为 $[0.5987,0.4013]$ 与 $[0.3100,0.6900]$。若 $V=[(2,0),(0,4)]$，输出分别约为 $(1.1974,1.6052)$ 与 $(0.6200,2.7600)$。这只是展示“查询字典并加权重构”的计算，不是论文权重，也不证明字典一定选中正确纹理。

### ADR：让外部字典适配当前图像

论文式 5 将上一层注意力反向归一化，用更新后的图像特征重构字典，再与旧字典插值：

$$\hat D^{(l)}=\operatorname{Softmax}(\operatorname{Norm}(A^{(l)})^T)X^{(l+1)},$$

$$D^{(l+1)}=\sigma\hat D^{(l)}+(1-\sigma)D^{(l)},$$

其中 $\sigma$ 可学习。继续上面的演示，暂令 Norm 为恒等映射，取 $X^{(l+1)}=[(3,1),(1,5)]$、旧字典 $D=[(2,0),(0,2)]$、$\sigma=0.25$。对 $A$ 的两列分别 softmax 后约得 $[0.5717,0.4283]$ 与 $[0.4283,0.5717]$；因此 $\hat D\approx[(2.1434,2.7132),(1.8566,3.2868)]$，更新后 $D^{(l+1)}\approx[(2.0359,0.6783),(0.4642,2.3217)]$。实际 Norm 的学习参数和真实特征会改变数值；例子只说明更新方向。

### AC-MSA：按相似类别而不是空间窗口分组

对每个 token $x_j$，式 6 取相似度最大的字典原子：

$$\theta^i=\{x_j\mid\arg\max_k(A_{jk})=i\}.$$

各类别展平、按顺序拼接，再按固定大小 $n_s$ 切成子类别 $\phi^j$，每个子类内部做 MSA，最后逆排序回原位置。若 6 个 token 的类别为 $[1,1,2,1,2,2]$，则先得到 $[x_1,x_2,x_4]$ 与 $[x_3,x_5,x_6]$；取 $n_s=2$ 后形成 $[x_1,x_2]$、$[x_4,x_3]$、$[x_5,x_6]$。类别边界处可能混入一个相邻类别，补充材料说明错分数量不超过字典大小 $M=128$，但该说法是作者的经验解释，不是误差上界的独立证明。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig3-atd-architecture.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig3-atd-architecture.png' | relative_url }}" alt="ATD 原图 3：窗口 MSA、AC-MSA 和 TDCA 并行组成的整体架构" width="1160" height="405" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 3｜ATD 整体架构。</strong>每层并行使用窗口 MSA、AC-MSA 与 TDCA；注意力图还用于跨层更新字典。该结构说明三条路径如何组合，但不能单独判断每条路径的因果贡献，需结合表 1 顺序消融。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.pdf#page=5">Zhang 等，CVPR 2024，图 3，正文 PDF 第 5 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

## 训练协议与可比性

标准 ATD 使用 DF2K，LR crop $64\times64$、batch 32、AdamW、L1 loss。×2 第一阶段训练 300K iterations，初始学习率 $2\times10^{-4}$，250K 时减半；第二阶段把 crop 增至 $96\times96$ 再训练 250K，学习率在 150K、200K、225K、240K 减半，并在每阶段 warm-up。×3/×4 从 ×2 权重开始，仅执行第二阶段。

ATD-light 只用 DIV2K；×2 训练 500K，×3/×4 从 ×2 微调 250K，且不使用大 crop 阶段。因此 ATD 与 ATD-light 的数据和训练预算不同，不能只按参数量把它们当作同一协议的大小模型。

## 消融证据：哪些部分贡献更大

表 1 使用缩放后的 ATD-light、DIV2K、250K iterations；下列增量只适用于该消融协议。

| 配置 | Urban100 ×4 PSNR/SSIM | Manga109 ×4 PSNR/SSIM | 相对上一步 |
| --- | --- | --- | --- |
| 基线 | 26.25 / 0.7907 | 30.66 / 0.9113 | — |
| + TDCA | 26.32 / 0.7929 | 30.76 / 0.9118 | +0.07 / +0.10 dB |
| + ADR | 26.36 / 0.7931 | 30.79 / 0.9123 | +0.04 / +0.03 dB |
| + AC-MSA | 26.51 / 0.7975 | 30.98 / 0.9144 | +0.15 / +0.19 dB |

AC-MSA 是这条顺序消融中最大的增量项，但论文没有报告所有加入顺序，不能把顺序增益当作唯一因果分解。TDCA 和 ADR 均有正增量，不过去掉后网络仍可工作，因此本次把三者都归为 contributing，而不是证明“不可缺失”的 load-bearing 组件。

类别设计的对照更值得保留：不做 category attention、随机分组、自适应分组在 Urban100 上分别为 26.25、26.46、26.51 dB，在 Manga109 上为 30.66、30.92、30.98 dB。分组本身已经贡献大部分增益；学习到的自适应类别相对随机分组仅再提高 0.05–0.06 dB。该结果支持 adaptive grouping 有效，但不支持把全部收益归给语义正确的字典分类。

子类别大小 $n_s=0/64/128/192$ 时 Urban100 为 26.36/26.44/26.51/26.55 dB；论文选择 128 是性能和成本折中，不是测得的最高 PSNR。字典大小 $M=16/32/64/96$ 时 Manga109 为 30.90/30.97/30.98/30.95 dB，说明字典并非越大越好。

## 与 HAT 的同协议结果

正文表 4 为经典 bicubic、Y 通道 PSNR/SSIM。以下只比较表内 HAT 与 ATD；没有报告多随机种子误差条。

| 倍率 / 数据集 | HAT | ATD | 差值 |
| --- | ---: | ---: | ---: |
| ×2 Urban100 | 34.45 | 34.73 | +0.28 dB |
| ×2 Manga109 | 40.26 | 40.35 | +0.09 dB |
| ×4 Urban100 | 27.97 | 28.22 | +0.25 dB |
| ×4 Manga109 | 32.48 | 32.65 | +0.17 dB |
| ×2 Set5 | 38.63 | 38.61 | −0.02 dB |

ATD 不是所有基准都领先；×2 Set5 低于 HAT 0.02 dB。补充表 B.1 按 $64\times64$ LR 输入报告 ATD 20.3M / 417G，HAT 20.8M / 412G，因此更准确的说法是参数略少、FLOPs 略高、复杂度相近，而不是 ATD 更省算力。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig4-visual-comparisons.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/atd-cvpr-2024/fig4-visual-comparisons.png' | relative_url }}" alt="ATD 原图 4：Urban100 与 Manga109 四倍超分辨局部纹理对比" width="1160" height="480" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 4｜经典 ×4 SR 的局部视觉对比。</strong>先以 HR 的线条、砖纹和规则网格为参照，再看 ATD 与 RCAN、SwinIR、CAT、ART、HAT 的局部重建。ATD 在所选区域更接近 HR，但这是作者挑选的定性样例，不能替代数据集平均结果。来源：<a href="https://openaccess.thecvf.com/content/CVPR2024/papers/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.pdf#page=8">Zhang 等，CVPR 2024，图 4，正文 PDF 第 8 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

图 4 的局部纹理示例展示 ATD 在所选区域更接近 HR 的线条和规则结构。这是作者选择的定性样例；它不能替代整套基准均值，也不能证明所有增强细节都真实。

## 证据边界与异常记录

1. **任务边界。**证据来自经典 bicubic SISR 的 Set5、Set14、BSD100、Urban100、Manga109，不覆盖真实拍摄退化、噪声压缩、生成式感知质量或用户偏好，不应与 SeeSR 等真实世界生成式方法混成总榜。
2. **复杂度边界。**补充表 B.1 的 FLOPs 按 $64\times64$ LR 输入；FLOPs 不能替代实际延迟、峰值显存或端侧功耗。ATD 比 HAT 多 5G FLOPs，作者只主张 comparable complexity。
3. **表格内部不一致。**补充表 B.1 把 HAT 的 Urban100 ×4 SSIM 写成 0.9368，而正文表 4 与补充表 B.2 都是 0.8368，前者高度疑似排版错误。本次保留异常，不用其中任一数值修改原表。
4. **同名结果的小幅差异。**补充表 B.1 的 ATD Urban100/Manga109 为 28.17/32.63，正文表 4 和补充表 B.2 为 28.22/32.65；材料没有给出足够信息解释差异，不能任选更高值替换。
5. **复现缺口。**论文未报告多次运行方差；裁边、量化和自集成的完整统一细节需结合代码核验。本次没有运行代码，因此不宣称复现成功。

## 对研究设计的启示

ATD 最有价值的抽象是“低秩全局路由 + 图像内动态重组”：小字典承担全局路由，随后再在被路由的 token 间做较贵交互。对端侧 SR，这提供了比全局 $N^2$ 注意力更可控的方向，但论文现有大模型仍约 20M 参数、417G FLOPs，不能直接视为端侧方案。真正值得继续验证的是：字典大小、子组大小和循环更新是否能按图像难度动态缩减，以及随机/简单聚类是否已经足以取得大部分收益。

## 继续阅读

[本月候选与后续阅读清单]({{ '/research/image-sr/2026-11/' | relative_url }}) · [调研范围与研究路线]({{ '/research/image-sr/' | relative_url }}) · [栏目首页]({{ '/research/image-sr/' | relative_url }})
