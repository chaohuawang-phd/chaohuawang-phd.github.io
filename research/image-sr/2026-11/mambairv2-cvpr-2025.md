---
layout: page
title: MambaIRv2 CVPR 2025 论文精读
permalink: /research/image-sr/2026-11/mambairv2-cvpr-2025/
description: 从 ASE 与 SGN 理解 MambaIRv2 的单向扫描、全局提示、长程交互与性能成本边界。
nav: false
math: true
---

这篇 CVPR 2025 论文尝试修复 Mamba 用于图像复原时的两个结构性问题：因果扫描看不到后续像素，远距离贡献又随状态转移连乘而衰减。作者提出 Attentive State-space Equation（ASE）与 Semantic Guided Neighboring（SGN），在单向扫描中补入全局提示，并把同语义像素搬到序列邻域。结论应收窄为：在论文给定的超分协议和 MACs 口径下，MambaIRv2 取得了有竞争力的性能—成本折中；这不等同于已证明真实硬件延迟更低。

**论文信息**：Hang Guo 等，CVPR 2025，页 28124–28133。正式接收证据：[CVF 论文页](https://openaccess.thecvf.com/content/CVPR2025/html/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.html) · [正文 PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2025/supplemental/Guo_MambaIRv2_Attentive_State_CVPR_2025_supplemental.pdf)。本页读取正文 10 个 PDF 页面序列与补充材料 5 个页面序列。

## 研究问题与失败机制

作者指出三类失败：当前像素只依赖扫描序列中的前驱；多方向扫描扩大可见范围但带来额外成本与高相关冗余；状态转移矩阵的连乘会削弱远距离像素贡献。Figure 1 是机制示意，不是实验结果；Figure 2 才给出 MambaIR 的四向扫描特征相似度与控制矩阵分布。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig1-causal-vs-attentive.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig1-causal-vs-attentive.png' | relative_url }}" alt="MambaIRv2 原图 1：因果状态空间扫描和注意状态空间扫描的可见范围对比" width="1240" height="720" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 1｜因果扫描与注意状态空间。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf#page=1">Guo 等，CVPR 2025，Figure 1，正文 PDF 第 1 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

**读图**：原论文 Figure 1，PDF 页面序列 1。左侧展示因果扫描的受限可见性，右侧展示作者期望的全图感知与单次扫描。它支持“设计动机”，不能单独证明方法已经实现全局利用。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig2-scan-redundancy-decay.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig2-scan-redundancy-decay.png' | relative_url }}" alt="MambaIRv2 原图 2：四向扫描特征余弦相似度和控制矩阵分布" width="1250" height="660" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 2｜多向冗余与长程衰减。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf#page=3">Guo 等，CVPR 2025，Figure 2，正文 PDF 第 3 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

**读图**：原论文 Figure 2，PDF 页面序列 3。四向扫描特征在五个测试集上的余弦相似度约为 0.71–0.74；控制矩阵的经验分布集中在约 0.80 且小于 1。前者提示冗余，后者与长程衰减机制一致；两图都来自 MambaIR，不能直接当作 MambaIRv2 的性能结果。

## 方法

核心状态空间方程为：

$$
h_i=\bar{A}h_{i-1}+\bar{B}x_i,\qquad y_i=Ch_i+Dx_i
$$

展开到第 k 步后，早期输入 x0 对 yk 的系数包含 C Ā^k B̄。补充材料给出完整递推证明。一个只用于理解的标量算例是：令 C=B̄=1、Ā=0.8、D=0、x0=2，则 x0 到 y3 的贡献为 0.8^3×2=1.024；相同幅值的邻近输入若不经过三次连乘，其贡献为 2。这个数值不是论文实验，只解释 Ā^k 的衰减。

ASE 把输出矩阵 C 类比为线性注意力中的 Query。提示池 P=MN，其中 N 跨块共享、M 为块特定，随后用 Gumbel-Softmax 产生 one-hot 路由 R，并令实例提示 P=R𝒫，最终改写为：

$$
y_i=(C+P)h_i+Dx_i
$$

SGN 复用同一个路由矩阵，把同一提示类别的像素分组后展开成一维序列，再在 ASE 后逆变换回原空间。它不增加新的语义监督；所谓“语义”来自提示路由本身。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig3-architecture.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig3-architecture.png' | relative_url }}" alt="MambaIRv2 原图 3：整体网络、ASSM、ASE 提示路由与 SGN 重排架构" width="2440" height="1140" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 3｜整体架构、ASE 与 SGN。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf#page=4">Guo 等，CVPR 2025，Figure 3，正文 PDF 第 4 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

**读图**：原论文 Figure 3，PDF 页面序列 4。上部是浅层卷积、局部 Window MHSA、全局 ASSM 与重建头；下部依次给出 ASSM、ASE 路由提示和 SGN 展开/折叠。该图支持模块关系，不能支持各模块独立贡献；独立贡献要看消融。

## 训练协议与可比性

- 经典 SR 使用 DF2K，轻量 SR 使用 DIV2K；经典评测为 Set5、Set14、B100、Urban100、Manga109。

- PSNR/SSIM 在 Y 通道计算；训练裁剪为 64×64，SR 批量 32，Adam，L1 损失，初始学习率 2×10^-4。

- 2× 模型权重用于初始化 3×/4×，且后两者减半学习率与迭代数。

- 补充材料与 ATD 的 2× 经典 SR 对照是混合结果：MambaIRv2 在 Set5/Manga109 略高，在 Set14/B100/Urban100 略低，因此不能写成全面胜出。

## 关键结果

| 对照 | 参数量 | MACs | Urban100 2× PSNR/SSIM | Manga109 2× PSNR/SSIM |
|---|---:|---:|---:|---:|
| SRFormer-light | 853K | 236.3G | 32.91 / 0.9353 | 39.28 / 0.9785 |
| MambaIRv2-light | 774K | 286.3G | 33.26 / 0.9378 | 39.35 / 0.9785 |
| HAT | 20.8M | 514.9G | 34.45 / 0.9466 | 40.26 / 0.9809 |
| MambaIRv2-B | 22.9M | 445.8G | 34.49 / 0.9468 | 40.42 / 0.9810 |

轻量模型相对 SRFormer-light 在 Urban100 2× 高 0.35 dB、参数少 79K，但 MACs 高约 21%；“显著更高效”若只看参数成立，若看 MACs 则不成立。与 HAT 对比时，MambaIRv2-B 参数略多但 MACs 少 13.4%，Urban100/Manga109 分别高 0.04/0.16 dB。补充材料给出的不同输出尺寸 MACs 显示：256×256 时 MambaIRv2 比 HAT 低约 30%，到 1024×1024 时两者接近；这仍是理论 MACs，不是延迟或显存。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig4-qualitative.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig4-qualitative.png' | relative_url }}" alt="MambaIRv2 原图 4：Urban100 和 Manga109 的四倍经典超分辨定性比较" width="2440" height="680" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 4｜重复结构与纹理的定性比较。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf#page=6">Guo 等，CVPR 2025，Figure 4，正文 PDF 第 6 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

**读图**：原论文 Figure 4，PDF 页面序列 6。四组 Urban100/Manga109 纹理样例比较 HR、Bicubic、SwinIR、MambaIR、CAT-A、DAT、HAT 与 MambaIRv2。作者样例中 Ours 对重复线条和纹理方向保持更接近 HR；这是经挑选的定性证据，不能替代整套数据的平均指标或盲测。

## 消融与负载判断

| 组件 | Urban100 PSNR/SSIM | Manga109 PSNR/SSIM |
|---|---:|---:|
| Window MHSA | 32.89 / 0.9343 | 39.11 / 0.9772 |
| + ASE | 32.94 / 0.9351 | 39.20 / 0.9780 |
| + ASE + SGN | 32.97 / 0.9355 | 39.24 / 0.9784 |

ASE 带来 +0.05/+0.09 dB，SGN 再带来 +0.03/+0.04 dB；两者都是正增益，但增量很小。提示注入位置消融中 C 的 PSNR 最佳，不过 B 在 Urban100 SSIM 略高 0.0001，因此“C 在所有指标最优”不成立。论文没有报告多随机种子或置信区间，无法判断这些小差值的统计稳定性。

与 MambaIR 扫描数对照显示：MambaIRv2 单向扫描 774K/286G，在 Urban100 2× 为 33.26 dB；MambaIR-4 为 1.36M/568G、32.92 dB。这支持总体设计优于该基线，但不能只归因于 ASE 或 SGN，因为架构与局部注意力配置同时变化。

<figure>
  <a href="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig5-attentive-map.png' | relative_url }}" target="_blank" rel="noopener">
    <img class="img-fluid" src="{{ '/research/image-sr/2026-11/assets/mambairv2-cvpr-2025/fig5-attentive-map.png' | relative_url }}" alt="MambaIRv2 原图 5：查询像素与提示矩阵余弦相似度的注意状态空间可视化" width="1280" height="600" loading="lazy" decoding="async">
  </a>
  <figcaption><strong>原图 5｜注意状态空间可视化。</strong>来源：<a href="https://openaccess.thecvf.com/content/CVPR2025/papers/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.pdf#page=8">Guo 等，CVPR 2025，Figure 5，正文 PDF 第 8 页</a>。点击图片查看原尺寸。</figcaption>
</figure>

**读图**：原论文 Figure 5，PDF 页面序列 8。查询点对应提示与矩阵 C 的余弦相似图在建筑重复结构和文字轮廓上出现相关区域。作者为清晰度过滤了低相似点，因此它支持“学到结构相关性”的定性判断，不提供完整分布、因果归因或检索准确率。

## 局限与证据边界

- 作者承认尚未测试去模糊、去雾和去雨，不能把“通用复原骨干”外推到这些任务。

- 补充材料只报告 MACs，没有同硬件延迟、峰值显存或能耗。

- 语义路由的可解释性主要来自可视化，未给出类别一致性或错误路由统计。

- 经典 bicubic SR 与真实世界生成式 SR 的退化、目标和指标不同，不能与 SeeSR、TSD-SR、VOSR、DreamSR 合并排名。

- 论文也报告 JPEG 去块和 σ=15 彩色去噪，但本页重点是图像超分辨；这些结果只说明跨任务可迁移的初步证据。

## 检索与去重记录

本轮覆盖窗口为 2022-01-01 至 2026-11-17（Asia/Shanghai），沿既有队列完成 MambaIRv2 一篇深读，没有扩展新的 venue 目录。正式资格由 CVPR 2025 官方论文页与会议 PDF 确认；补充材料用于训练配置、效率、证明和局限核对。按 CVF 官方页面、标准化标题、作者与年份以及 arXiv/CVF 版本关系去重，候选总数仍为 9。ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 与 2022 年来源仍为待检索，不能解释为零结果。

## 继续阅读

[本月候选与后续阅读清单]({{ '/research/image-sr/2026-11/' | relative_url }}) · [调研范围与研究路线]({{ '/research/image-sr/' | relative_url }}) · [栏目首页]({{ '/research/image-sr/' | relative_url }})

